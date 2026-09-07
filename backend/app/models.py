from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from .database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Hunter(Base):
    __tablename__ = "hunters"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), default="Chandan DK", nullable=False)
    title = Column(String(100), default="Awakened Hunter", nullable=False)
    level = Column(Integer, default=1, nullable=False)
    current_xp = Column(Integer, default=0, nullable=False)
    unallocated_stat_points = Column(Integer, default=0, nullable=False)

    # Attributes
    str_stat = Column(Integer, default=10, nullable=False)
    int_stat = Column(Integer, default=10, nullable=False)
    vit_stat = Column(Integer, default=10, nullable=False)
    agi_stat = Column(Integer, default=10, nullable=False)
    sense_stat = Column(Integer, default=10, nullable=False)

    # Streaks & Penalty State
    streak_count = Column(Integer, default=0, nullable=False)
    longest_streak = Column(Integer, default=0, nullable=False)
    penalty_zone_active = Column(Boolean, default=False, nullable=False)
    redemption_progress = Column(Integer, default=0, nullable=False) # 0 to 3
    last_judged_date = Column(String(20), nullable=True)
    last_login_date = Column(String(20), nullable=True)

    created_at = Column(DateTime, default=utc_now, nullable=False)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now, nullable=False)

class Quest(Base):
    __tablename__ = "quests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    stat_link = Column(String(20), default="STR", nullable=False) # STR, INT, VIT, AGI, SENSE
    difficulty = Column(String(20), default="Normal", nullable=False) # Easy, Normal, Hard, Epic
    xp_reward = Column(Integer, default=20, nullable=False)
    is_daily = Column(Boolean, default=True, nullable=False)
    active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

    completions = relationship("QuestCompletion", back_populates="quest", cascade="all, delete-orphan")

class QuestCompletion(Base):
    __tablename__ = "quest_completions"

    id = Column(Integer, primary_key=True, index=True)
    quest_id = Column(Integer, ForeignKey("quests.id", ondelete="CASCADE"), nullable=False)
    completion_date = Column(String(20), nullable=False) # YYYY-MM-DD
    completed = Column(Boolean, default=True, nullable=False)
    completed_at = Column(DateTime, default=utc_now, nullable=False)

    quest = relationship("Quest", back_populates="completions")

    __table_args__ = (
        UniqueConstraint("quest_id", "completion_date", name="uq_quest_date"),
    )

class DailyRecord(Base):
    __tablename__ = "daily_records"

    id = Column(Integer, primary_key=True, index=True)
    record_date = Column(String(20), unique=True, nullable=False) # YYYY-MM-DD
    total_quests = Column(Integer, default=0, nullable=False)
    completed_quests = Column(Integer, default=0, nullable=False)
    failed_quests = Column(Integer, default=0, nullable=False)
    xp_gained = Column(Integer, default=0, nullable=False)
    xp_lost = Column(Integer, default=0, nullable=False)
    net_xp = Column(Integer, default=0, nullable=False)
    penalty_zone_triggered = Column(Boolean, default=False, nullable=False)
    redemption_cleared = Column(Boolean, default=False, nullable=False)
    streak_after = Column(Integer, default=0, nullable=False)
    level_after = Column(Integer, default=1, nullable=False)
    quests_snapshot = Column(Text, nullable=True) # JSON snapshot of quest titles and statuses
    created_at = Column(DateTime, default=utc_now, nullable=False)

class XPTransaction(Base):
    __tablename__ = "xp_transactions"

    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Integer, nullable=False)
    source = Column(String(50), nullable=False) # QUEST, PENALTY, PENALTY_ZONE, REDEMPTION, LEVEL_UP, MANUAL
    description = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=utc_now, nullable=False)

class LevelHistory(Base):
    __tablename__ = "level_history"

    id = Column(Integer, primary_key=True, index=True)
    level = Column(Integer, nullable=False)
    trigger = Column(String(50), nullable=False) # LEVEL_UP, DEMOTION
    details = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=utc_now, nullable=False)

