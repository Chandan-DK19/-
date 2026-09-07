import json
from datetime import date
from typing import List
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Hunter, Quest, QuestCompletion, DailyRecord, XPTransaction, LevelHistory
from ..schemas import DailyRecordOut, XPTransactionOut, AnalyticsSummary
from ..system_engine import calculate_daily_evaluation
from .hunter import get_or_create_hunter, format_hunter_out

router = APIRouter(prefix="/api/history", tags=["History & Analytics"])

def get_today_str() -> str:
    return date.today().isoformat()

@router.post("/end-day")
def evaluate_and_end_day(
    target_date: str = Query(default=None),
    db: Session = Depends(get_db)
):
    query_date = target_date or get_today_str()
    hunter = get_or_create_hunter(db)

    # Check all active daily quests
    quests = db.query(Quest).filter(Quest.active == True, Quest.is_daily == True).all()
    quests_data = [{"id": q.id, "title": q.title, "xp_reward": q.xp_reward, "stat_link": q.stat_link} for q in quests]

    # Find which quests were completed for target_date
    completions = db.query(QuestCompletion).filter(
        QuestCompletion.completion_date == query_date,
        QuestCompletion.completed == True
    ).all()
    completed_ids = [c.quest_id for c in completions]

    eval_result = calculate_daily_evaluation(
        current_level=hunter.level,
        current_xp=hunter.current_xp,
        current_streak=hunter.streak_count,
        longest_streak=hunter.longest_streak,
        penalty_zone_active=hunter.penalty_zone_active,
        redemption_progress=hunter.redemption_progress,
        quests=quests_data,
        completed_ids=completed_ids
    )

    # Apply results to Hunter
    hunter.level = eval_result["level_after"]
    hunter.current_xp = eval_result["xp_after"]
    hunter.unallocated_stat_points += eval_result["stat_points_granted"]
    hunter.streak_count = eval_result["streak_after"]
    hunter.longest_streak = eval_result["longest_streak"]
    hunter.penalty_zone_active = eval_result["penalty_zone_active"]
    hunter.redemption_progress = eval_result["redemption_progress"]
    hunter.last_judged_date = query_date

    # Record Level History if level changed
    if eval_result["level_after"] > eval_result["level_before"]:
        db.add(LevelHistory(
            level=eval_result["level_after"],
            trigger="LEVEL_UP",
            details=f"Day rollover {query_date}: Level up to {eval_result['level_after']} (+{eval_result['stat_points_granted']} stat points)"
        ))
    elif eval_result["demoted"]:
        db.add(LevelHistory(
            level=eval_result["level_after"],
            trigger="DEMOTION",
            details=f"Day rollover {query_date}: Demoted to Level {eval_result['level_after']} due to sustained penalties"
        ))

    # Log XP Transactions for penalties/bonuses
    quest_penalty_amount = eval_result["base_xp_penalty"] + eval_result["extra_penalty"]
    if quest_penalty_amount > 0:
        db.add(XPTransaction(
            amount=-quest_penalty_amount,
            source="PENALTY_ZONE" if eval_result["penalty_zone_triggered"] else "DAILY_PENALTY",
            description=f"Rollover {query_date}: Failed {eval_result['failed_count']} quests (-{quest_penalty_amount} XP)"
        ))

    if eval_result.get("streak_xp_penalty", 0) > 0:
        db.add(XPTransaction(
            amount=-eval_result["streak_xp_penalty"],
            source="STREAK_PENALTY",
            description=f"Rollover {query_date}: Lost {eval_result['streak_before']}-day streak (-{eval_result['streak_xp_penalty']} XP)"
        ))

    if eval_result["redemption_bonus"] > 0:
        db.add(XPTransaction(
            amount=eval_result["redemption_bonus"],
            source="REDEMPTION_BONUS",
            description=f"Rollover {query_date}: 3-Day Redemption Comeback (+15 XP)"
        ))

    # Persist or update DailyRecord
    daily_rec = db.query(DailyRecord).filter(DailyRecord.record_date == query_date).first()
    snapshot = json.dumps([
        {
            "id": q.id,
            "title": q.title,
            "stat_link": q.stat_link,
            "completed": q.id in completed_ids,
            "xp_reward": q.xp_reward
        }
        for q in quests
    ])

    if not daily_rec:
        daily_rec = DailyRecord(
            record_date=query_date,
            total_quests=eval_result["total_quests"],
            completed_quests=eval_result["completed_count"],
            failed_quests=eval_result["failed_count"],
            xp_gained=eval_result["xp_gained"],
            xp_lost=eval_result["xp_lost"],
            net_xp=eval_result["net_xp_change"],
            penalty_zone_triggered=eval_result["penalty_zone_triggered"],
            redemption_cleared=eval_result["redemption_cleared"],
            streak_after=eval_result["streak_after"],
            level_after=eval_result["level_after"],
            quests_snapshot=snapshot
        )
        db.add(daily_rec)
    else:
        daily_rec.total_quests = eval_result["total_quests"]
        daily_rec.completed_quests = eval_result["completed_count"]
        daily_rec.failed_quests = eval_result["failed_count"]
        daily_rec.xp_gained = eval_result["xp_gained"]
        daily_rec.xp_lost = eval_result["xp_lost"]
        daily_rec.net_xp = eval_result["net_xp_change"]
        daily_rec.penalty_zone_triggered = eval_result["penalty_zone_triggered"]
        daily_rec.redemption_cleared = eval_result["redemption_cleared"]
        daily_rec.streak_after = eval_result["streak_after"]
        daily_rec.level_after = eval_result["level_after"]
        daily_rec.quests_snapshot = snapshot

    db.commit()
    db.refresh(hunter)

    return {
        "evaluation": eval_result,
        "hunter": format_hunter_out(hunter),
        "message": "Daily evaluation completed successfully."
    }

@router.get("/daily", response_model=List[DailyRecordOut])
def get_daily_records(limit: int = 30, db: Session = Depends(get_db)):
    return db.query(DailyRecord).order_by(DailyRecord.record_date.desc()).limit(limit).all()

@router.get("/transactions", response_model=List[XPTransactionOut])
def get_transactions(limit: int = 50, db: Session = Depends(get_db)):
    return db.query(XPTransaction).order_by(XPTransaction.created_at.desc()).limit(limit).all()

@router.get("/analytics", response_model=AnalyticsSummary)
def get_analytics(db: Session = Depends(get_db)):
    records = db.query(DailyRecord).order_by(DailyRecord.record_date.desc()).limit(30).all()
    transactions = db.query(XPTransaction).order_by(XPTransaction.created_at.desc()).limit(30).all()

    # 7-day rate
    recent_7 = records[:7]
    total_7 = sum(r.total_quests for r in recent_7)
    comp_7 = sum(r.completed_quests for r in recent_7)
    rate_7 = round((comp_7 / total_7) * 100, 1) if total_7 > 0 else 100.0

    # 30-day rate
    total_30 = sum(r.total_quests for r in records)
    comp_30 = sum(r.completed_quests for r in records)
    rate_30 = round((comp_30 / total_30) * 100, 1) if total_30 > 0 else 100.0

    total_xp = sum(t.amount for t in transactions if t.amount > 0)
    total_pen = abs(sum(t.amount for t in transactions if t.amount < 0))

    return AnalyticsSummary(
        completion_rate_7d=rate_7,
        completion_rate_30d=rate_30,
        total_xp_earned=total_xp,
        total_penalties_incurred=total_pen,
        daily_records=records,
        recent_transactions=transactions
    )
