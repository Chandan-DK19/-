from datetime import datetime, date, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import Quest, QuestCompletion, Hunter, XPTransaction, LevelHistory
from ..schemas import QuestCreate, QuestUpdate, QuestOut, ToggleQuestResponse
from ..system_engine import DIFFICULTY_XP_MAP, check_level_up
from .hunter import get_or_create_hunter, format_hunter_out

router = APIRouter(prefix="/api/quests", tags=["Quests"])

def get_today_str() -> str:
    return date.today().isoformat()

@router.get("", response_model=List[QuestOut])
def get_quests(
    target_date: str = Query(default=None),
    db: Session = Depends(get_db)
):
    query_date = target_date or get_today_str()
    quests = db.query(Quest).filter(Quest.active == True).all()

    # Fetch completions for this date
    completions = db.query(QuestCompletion).filter(
        QuestCompletion.completion_date == query_date,
        QuestCompletion.completed == True
    ).all()
    completed_ids = {c.quest_id for c in completions}

    res = []
    for q in quests:
        res.append(QuestOut(
            id=q.id,
            title=q.title,
            description=q.description,
            stat_link=q.stat_link,
            difficulty=q.difficulty,
            xp_reward=q.xp_reward,
            is_daily=q.is_daily,
            active=q.active,
            completed_today=(q.id in completed_ids),
            created_at=q.created_at
        ))
    return res

@router.post("", response_model=QuestOut)
def create_quest(req: QuestCreate, db: Session = Depends(get_db)):
    xp = req.xp_reward or DIFFICULTY_XP_MAP.get(req.difficulty, 20)
    quest = Quest(
        title=req.title.strip(),
        description=req.description.strip() if req.description else None,
        stat_link=req.stat_link.strip().upper(),
        difficulty=req.difficulty,
        xp_reward=xp,
        is_daily=req.is_daily,
        active=True
    )
    db.add(quest)
    db.commit()
    db.refresh(quest)
    return QuestOut(
        id=quest.id,
        title=quest.title,
        description=quest.description,
        stat_link=quest.stat_link,
        difficulty=quest.difficulty,
        xp_reward=quest.xp_reward,
        is_daily=quest.is_daily,
        active=quest.active,
        completed_today=False,
        created_at=quest.created_at
    )

@router.patch("/{quest_id}", response_model=QuestOut)
def update_quest(quest_id: int, req: QuestUpdate, db: Session = Depends(get_db)):
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    if req.title is not None:
        quest.title = req.title.strip()
    if req.description is not None:
        quest.description = req.description.strip()
    if req.stat_link is not None:
        quest.stat_link = req.stat_link.strip().upper()
    if req.difficulty is not None:
        quest.difficulty = req.difficulty
        if req.xp_reward is None:
            quest.xp_reward = DIFFICULTY_XP_MAP.get(req.difficulty, quest.xp_reward)
    if req.xp_reward is not None:
        quest.xp_reward = req.xp_reward
    if req.active is not None:
        quest.active = req.active

    db.commit()
    db.refresh(quest)

    today = get_today_str()
    comp = db.query(QuestCompletion).filter(
        QuestCompletion.quest_id == quest_id,
        QuestCompletion.completion_date == today,
        QuestCompletion.completed == True
    ).first()

    return QuestOut(
        id=quest.id,
        title=quest.title,
        description=quest.description,
        stat_link=quest.stat_link,
        difficulty=quest.difficulty,
        xp_reward=quest.xp_reward,
        is_daily=quest.is_daily,
        active=quest.active,
        completed_today=(comp is not None),
        created_at=quest.created_at
    )

@router.delete("/{quest_id}")
def delete_quest(quest_id: int, db: Session = Depends(get_db)):
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")
    quest.active = False
    db.commit()
    return {"message": "Quest archived", "quest_id": quest_id}

@router.post("/{quest_id}/toggle", response_model=ToggleQuestResponse)
def toggle_quest_completion(
    quest_id: int,
    target_date: str = Query(default=None),
    db: Session = Depends(get_db)
):
    query_date = target_date or get_today_str()
    quest = db.query(Quest).filter(Quest.id == quest_id).first()
    if not quest:
        raise HTTPException(status_code=404, detail="Quest not found")

    hunter = get_or_create_hunter(db)
    comp = db.query(QuestCompletion).filter(
        QuestCompletion.quest_id == quest_id,
        QuestCompletion.completion_date == query_date
    ).first()

    level_up = False
    stat_points_granted = 0
    xp_change = 0
    stat_awarded = None

    if comp and comp.completed:
        # Toggle from completed -> uncompleted
        comp.completed = False
        xp_change = -quest.xp_reward
        hunter.current_xp = max(0, hunter.current_xp - quest.xp_reward)

        # Reverse stat training point if > 10
        stat_key = quest.stat_link.upper()
        if stat_key == "STR" and hunter.str_stat > 10:
            hunter.str_stat -= 1
        elif stat_key == "INT" and hunter.int_stat > 10:
            hunter.int_stat -= 1
        elif stat_key == "VIT" and hunter.vit_stat > 10:
            hunter.vit_stat -= 1
        elif stat_key == "AGI" and hunter.agi_stat > 10:
            hunter.agi_stat -= 1
        elif stat_key in ("SENSE", "PER", "SNS") and hunter.sense_stat > 10:
            hunter.sense_stat -= 1

        tx = XPTransaction(
            amount=-quest.xp_reward,
            source="QUEST_REVOKE",
            description=f"Revoked completion: {quest.title}"
        )
        db.add(tx)
        is_completed = False
    else:
        # Mark as completed
        if not comp:
            comp = QuestCompletion(
                quest_id=quest_id,
                completion_date=query_date,
                completed=True
            )
            db.add(comp)
        else:
            comp.completed = True
            comp.completed_at = datetime.now(timezone.utc)

        xp_change = quest.xp_reward
        hunter.current_xp += quest.xp_reward
        stat_awarded = quest.stat_link.upper()

        # Award +1 to the linked stat attribute directly
        if stat_awarded == "STR":
            hunter.str_stat += 1
        elif stat_awarded == "INT":
            hunter.int_stat += 1
        elif stat_awarded == "VIT":
            hunter.vit_stat += 1
        elif stat_awarded == "AGI":
            hunter.agi_stat += 1
        elif stat_awarded in ("SENSE", "PER", "SNS"):
            hunter.sense_stat += 1

        tx = XPTransaction(
            amount=quest.xp_reward,
            source="QUEST_COMPLETE",
            description=f"Completed quest: {quest.title} (+{quest.xp_reward} XP, +1 {stat_awarded})"
        )
        db.add(tx)

        # Check for Level Up!
        new_level, remaining_xp, granted_pts = check_level_up(hunter.level, hunter.current_xp)
        if new_level > hunter.level:
            level_up = True
            stat_points_granted = granted_pts
            hunter.level = new_level
            hunter.current_xp = remaining_xp
            hunter.unallocated_stat_points += granted_pts

            lvl_record = LevelHistory(
                level=new_level,
                trigger="LEVEL_UP",
                details=f"Ascended to Level {new_level} via {quest.title} (+{granted_pts} stat points)"
            )
            db.add(lvl_record)

        is_completed = True

    db.commit()
    db.refresh(hunter)

    return ToggleQuestResponse(
        quest_id=quest_id,
        completed=is_completed,
        xp_change=xp_change,
        stat_awarded=stat_awarded if is_completed else None,
        level_up=level_up,
        stat_points_granted=stat_points_granted,
        hunter=format_hunter_out(hunter)
    )
