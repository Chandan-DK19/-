from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Hunter, Quest, QuestCompletion, DailyRecord, XPTransaction, LevelHistory
from ..schemas import HunterOut, StatAllocateRequest
from ..system_engine import derive_rank, xp_required_for_next_level, calculate_missed_login_penalties, MISSED_LOGIN_PENALTY

router = APIRouter(prefix="/api/hunter", tags=["Hunter"])

def get_or_create_hunter(db: Session) -> Hunter:
    hunter = db.query(Hunter).first()
    if not hunter:
        today_str = date.today().isoformat()
        hunter = Hunter(
            username="Chandan DK",
            title="The Awakened Hunter",
            level=1,
            current_xp=0,
            unallocated_stat_points=0,
            str_stat=10,
            int_stat=10,
            vit_stat=10,
            agi_stat=10,
            sense_stat=10,
            streak_count=0,
            longest_streak=0,
            penalty_zone_active=False,
            redemption_progress=0,
            last_login_date=today_str,
        )
        db.add(hunter)
        db.commit()
        db.refresh(hunter)
    return hunter

def format_hunter_out(
    hunter: Hunter,
    missed_days_count: int = 0,
    missed_login_penalty_applied: int = 0,
    missed_dates: Optional[List[str]] = None
) -> HunterOut:
    req = xp_required_for_next_level(hunter.level)
    pct = round(min(100.0, (hunter.current_xp / req) * 100), 1) if req > 0 else 0.0
    rank = derive_rank(hunter.level)
    return HunterOut(
        id=hunter.id,
        username=hunter.username,
        title=hunter.title,
        level=hunter.level,
        current_xp=hunter.current_xp,
        xp_to_next=req,
        xp_percentage=pct,
        unallocated_stat_points=hunter.unallocated_stat_points,
        str_stat=hunter.str_stat,
        int_stat=hunter.int_stat,
        vit_stat=hunter.vit_stat,
        agi_stat=hunter.agi_stat,
        sense_stat=hunter.sense_stat,
        streak_count=hunter.streak_count,
        longest_streak=hunter.longest_streak,
        penalty_zone_active=hunter.penalty_zone_active,
        redemption_progress=hunter.redemption_progress,
        last_login_date=hunter.last_login_date,
        missed_days_count=missed_days_count,
        missed_login_penalty_applied=missed_login_penalty_applied,
        missed_dates=missed_dates or [],
        rank=rank,
    )

@router.get("", response_model=HunterOut)
def get_hunter_profile(
    target_date: Optional[str] = Query(default=None),
    db: Session = Depends(get_db)
):
    hunter = get_or_create_hunter(db)
    today_str = target_date or date.today().isoformat()

    missed_days_count = 0
    missed_penalty_applied = 0
    missed_dates_list = []

    if not hunter.last_login_date:
        hunter.last_login_date = today_str
        db.commit()
        db.refresh(hunter)
    elif hunter.last_login_date != today_str:
        res = calculate_missed_login_penalties(
            last_login_date_str=hunter.last_login_date,
            current_date_str=today_str,
            current_level=hunter.level,
            current_xp=hunter.current_xp,
            current_streak=hunter.streak_count,
        )

        if res["missed_days_count"] > 0:
            missed_days_count = res["missed_days_count"]
            missed_penalty_applied = res["total_xp_penalty"]
            missed_dates_list = res["missed_dates"]

            hunter.current_xp = res["xp_after"]
            hunter.level = res["level_after"]
            hunter.streak_count = res["streak_after"]
            hunter.redemption_progress = 0

            if res["demoted"]:
                db.add(LevelHistory(
                    level=hunter.level,
                    trigger="DEMOTION",
                    details=f"Demoted to Level {hunter.level} due to {missed_days_count} missed login day(s)"
                ))

            # Record transactions and daily records for each missed day
            active_quest_count = db.query(Quest).filter(Quest.active == True, Quest.is_daily == True).count()
            for m_date in missed_dates_list:
                db.add(XPTransaction(
                    amount=-res["penalty_per_day"],
                    source="MISSED_LOGIN_PENALTY",
                    description=f"Missed login penalty for {m_date} (-{res['penalty_per_day']} XP)"
                ))

                existing_rec = db.query(DailyRecord).filter(DailyRecord.record_date == m_date).first()
                if not existing_rec:
                    db.add(DailyRecord(
                        record_date=m_date,
                        total_quests=active_quest_count,
                        completed_quests=0,
                        failed_quests=active_quest_count,
                        xp_gained=0,
                        xp_lost=res["penalty_per_day"],
                        net_xp=-res["penalty_per_day"],
                        penalty_zone_triggered=False,
                        redemption_cleared=False,
                        streak_after=0,
                        level_after=hunter.level,
                        quests_snapshot="[]"
                    ))

        hunter.last_login_date = today_str
        db.commit()
        db.refresh(hunter)

    return format_hunter_out(
        hunter,
        missed_days_count=missed_days_count,
        missed_login_penalty_applied=missed_penalty_applied,
        missed_dates=missed_dates_list
    )

@router.post("/allocate-stat", response_model=HunterOut)
def allocate_stat(req: StatAllocateRequest, db: Session = Depends(get_db)):
    hunter = get_or_create_hunter(db)
    if hunter.unallocated_stat_points <= 0:
        raise HTTPException(status_code=400, detail="No unallocated stat points available.")

    stat = req.stat.strip().upper()
    if stat == "STR":
        hunter.str_stat += 1
    elif stat == "INT":
        hunter.int_stat += 1
    elif stat == "VIT":
        hunter.vit_stat += 1
    elif stat == "AGI":
        hunter.agi_stat += 1
    elif stat in ("SENSE", "PER", "SNS"):
        hunter.sense_stat += 1
    else:
        raise HTTPException(status_code=400, detail=f"Invalid stat: {stat}. Must be STR, INT, VIT, AGI, or SENSE.")

    hunter.unallocated_stat_points -= 1
    db.commit()
    db.refresh(hunter)
    return format_hunter_out(hunter)

@router.post("/reset", response_model=HunterOut)
def reset_progress(seed_default_quests: bool = True, db: Session = Depends(get_db)):
    """
    Resets Hunter stats, level, streaks, and history. Optionally seeds default starter quests.
    """
    hunter = get_or_create_hunter(db)
    hunter.level = 1
    hunter.current_xp = 0
    hunter.unallocated_stat_points = 0
    hunter.str_stat = 10
    hunter.int_stat = 10
    hunter.vit_stat = 10
    hunter.agi_stat = 10
    hunter.sense_stat = 10
    hunter.streak_count = 0
    hunter.longest_streak = 0
    hunter.penalty_zone_active = False
    hunter.redemption_progress = 0
    hunter.last_judged_date = None
    hunter.last_login_date = date.today().isoformat()

    db.query(QuestCompletion).delete()
    db.query(DailyRecord).delete()
    db.query(XPTransaction).delete()
    db.query(LevelHistory).delete()

    if seed_default_quests:
        db.query(Quest).delete()
        default_quests = [
            Quest(title="Gym", description="Hit the gym — strength training, hypertrophy, or progressive overload session", stat_link="STR", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
            Quest(title="Water (4L per day)", description="Drink a full 4 liters of clean water throughout the day", stat_link="VIT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
            Quest(title="Sleep (7 hr)", description="Attain at least 7 hours of uninterrupted quality sleep", stat_link="VIT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
            Quest(title="Learn something new", description="Acquire fresh knowledge, read new literature, or study an unfamiliar concept", stat_link="INT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
            Quest(title="Revise", description="Review past study material, notes, algorithms, or concepts for active recall", stat_link="INT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
            Quest(title="Wakeup (6 am)", description="Wake up promptly at 6:00 AM without hitting snooze", stat_link="SENSE", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
            Quest(title="Sleep (11 pm)", description="Lights out and sleep by 11:00 PM sharp to secure recovery", stat_link="SENSE", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
            Quest(title="Diet goal (2700 kcal)", description="Hit the daily caloric target of 2,700 kcal for clean energy & muscle growth", stat_link="VIT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
            Quest(title="Protein diet (150gm)", description="Consume 150 grams of dietary protein for muscle repair and synthesis", stat_link="STR", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
            Quest(title="Save 5rs daily for MF", description="Set aside ₹5 daily investment contribution into Mutual Funds", stat_link="AGI", difficulty="Easy", xp_reward=10, is_daily=True, active=True),
        ]
        db.add_all(default_quests)

    db.commit()
    db.refresh(hunter)
    return format_hunter_out(hunter)
