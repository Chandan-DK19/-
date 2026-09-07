from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict

class HunterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    username: str
    title: str
    level: int
    current_xp: int
    xp_to_next: int
    xp_percentage: float
    unallocated_stat_points: int
    str_stat: int
    int_stat: int
    vit_stat: int
    agi_stat: int
    sense_stat: int
    streak_count: int
    longest_streak: int
    penalty_zone_active: bool
    redemption_progress: int
    last_login_date: Optional[str] = None
    missed_days_count: int = 0
    missed_login_penalty_applied: int = 0
    missed_dates: List[str] = []
    rank: str

class StatAllocateRequest(BaseModel):
    stat: str = Field(..., description="STR, INT, VIT, AGI, or SENSE")

class QuestCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    stat_link: str = Field(default="STR", description="STR, INT, VIT, AGI, SENSE")
    difficulty: str = Field(default="Normal", description="Easy, Normal, Medium, Hard, Epic")
    xp_reward: Optional[int] = None
    is_daily: bool = True

class QuestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    stat_link: Optional[str] = None
    difficulty: Optional[str] = None
    xp_reward: Optional[int] = None
    active: Optional[bool] = None

class QuestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    description: Optional[str]
    stat_link: str
    difficulty: str
    xp_reward: int
    is_daily: bool
    active: bool
    completed_today: bool = False
    created_at: datetime

class ToggleQuestResponse(BaseModel):
    quest_id: int
    completed: bool
    xp_change: int
    stat_awarded: Optional[str] = None
    level_up: bool
    stat_points_granted: int
    hunter: HunterOut

class DailyRecordOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    record_date: str
    total_quests: int
    completed_quests: int
    failed_quests: int
    xp_gained: int
    xp_lost: int
    net_xp: int
    penalty_zone_triggered: bool
    redemption_cleared: bool
    streak_after: int
    level_after: int
    quests_snapshot: Optional[str] = None
    created_at: datetime

class XPTransactionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    amount: int
    source: str
    description: str
    created_at: datetime

class AnalyticsSummary(BaseModel):
    completion_rate_7d: float
    completion_rate_30d: float
    total_xp_earned: int
    total_penalties_incurred: int
    daily_records: List[DailyRecordOut]
    recent_transactions: List[XPTransactionOut]
