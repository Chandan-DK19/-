import math
from typing import Dict, List, Tuple, Any

# Canonical Difficulty Rewards
DIFFICULTY_XP_MAP = {
    "Easy": 10,
    "Normal": 20,
    "Medium": 25,
    "Hard": 35,
    "Epic": 100,
}

# Penalty for breaking an active streak
DEFAULT_STREAK_PENALTY = 25

# Penalty for missing a daily login
MISSED_LOGIN_PENALTY = 25

def calculate_missed_login_penalties(
    last_login_date_str: Any,
    current_date_str: str,
    current_level: int,
    current_xp: int,
    current_streak: int,
) -> Dict[str, Any]:
    """
    Calculates penalties if the hunter missed logging in on one or more calendar days.
    """
    from datetime import date, timedelta
    
    if not last_login_date_str:
        return {
            "missed_days_count": 0,
            "missed_dates": [],
            "total_xp_penalty": 0,
            "level_before": current_level,
            "level_after": current_level,
            "xp_before": current_xp,
            "xp_after": current_xp,
            "demoted": False,
            "streak_before": current_streak,
            "streak_after": current_streak,
            "streak_broken": False,
        }

    try:
        last_d = date.fromisoformat(str(last_login_date_str))
        curr_d = date.fromisoformat(str(current_date_str))
    except Exception:
        return {
            "missed_days_count": 0,
            "missed_dates": [],
            "total_xp_penalty": 0,
            "level_before": current_level,
            "level_after": current_level,
            "xp_before": current_xp,
            "xp_after": current_xp,
            "demoted": False,
            "streak_before": current_streak,
            "streak_after": current_streak,
            "streak_broken": False,
        }

    days_diff = (curr_d - last_d).days
    if days_diff <= 1:
        # Same day (0) or consecutive day (1) -> No missed days
        return {
            "missed_days_count": 0,
            "missed_dates": [],
            "total_xp_penalty": 0,
            "level_before": current_level,
            "level_after": current_level,
            "xp_before": current_xp,
            "xp_after": current_xp,
            "demoted": False,
            "streak_before": current_streak,
            "streak_after": current_streak,
            "streak_broken": False,
        }

    missed_dates = []
    temp_d = last_d + timedelta(days=1)
    while temp_d < curr_d:
        missed_dates.append(temp_d.isoformat())
        temp_d += timedelta(days=1)

    missed_count = len(missed_dates)
    total_xp_penalty = missed_count * MISSED_LOGIN_PENALTY

    tentative_xp = current_xp - total_xp_penalty
    level = current_level
    demoted = False

    if tentative_xp < 0:
        level, tentative_xp, demoted = check_level_demotion(level, tentative_xp)

    streak_broken = current_streak > 0
    new_streak = 0

    return {
        "missed_days_count": missed_count,
        "missed_dates": missed_dates,
        "total_xp_penalty": total_xp_penalty,
        "penalty_per_day": MISSED_LOGIN_PENALTY,
        "level_before": current_level,
        "level_after": level,
        "xp_before": current_xp,
        "xp_after": tentative_xp,
        "demoted": demoted,
        "streak_before": current_streak,
        "streak_after": new_streak,
        "streak_broken": streak_broken,
    }


# Rank thresholds based on Hunter Level (Rules §2.4)
def derive_rank(level: int) -> str:
    """
    Ranks derived from Level:
    E: 1–9
    D: 10–19
    C: 20–34
    B: 35–49
    A: 50–69
    S: 70+
    """
    if level < 1:
        return "E"
    if level <= 9:
        return "E"
    elif level <= 19:
        return "D"
    elif level <= 34:
        return "C"
    elif level <= 49:
        return "B"
    elif level <= 69:
        return "A"
    else:
        return "S"

def xp_required_for_next_level(level: int) -> int:
    """
    Rules §2.2:
    xp_to_next = 100 * current_level^1.35 (rounded up)
    """
    if level < 1:
        level = 1
    return math.ceil(100 * (level ** 1.35))

def check_level_up(current_level: int, current_xp: int) -> Tuple[int, int, int]:
    """
    Processes level ups if current_xp exceeds the requirement.
    Returns: (new_level, remaining_xp, stat_points_granted)
    """
    level = current_level
    xp = current_xp
    stat_points = 0

    while True:
        req = xp_required_for_next_level(level)
        if xp >= req:
            xp -= req
            level += 1
            stat_points += 1
        else:
            break

    return level, xp, stat_points

def check_level_demotion(current_level: int, current_xp: int) -> Tuple[int, int, bool]:
    """
    Rules §2.3:
    If XP goes negative relative to current level, demote by 1 level if level > 1.
    Returns: (new_level, adjusted_xp, demoted_boolean)
    """
    level = current_level
    xp = current_xp
    demoted = False

    if xp < 0 and level > 1:
        level -= 1
        demoted = True
        prev_req = xp_required_for_next_level(level)
        xp = max(0, prev_req + xp)
    elif xp < 0:
        xp = 0

    return level, xp, demoted

def calculate_daily_evaluation(
    current_level: int,
    current_xp: int,
    current_streak: int,
    longest_streak: int,
    penalty_zone_active: bool,
    redemption_progress: int,
    quests: List[Dict[str, Any]],
    completed_ids: List[int]
) -> Dict[str, Any]:
    """
    Executes the authoritative Rules §2 Day Judgement logic.
    Returns a dictionary of all state changes, bonuses, and penalties.
    """
    total_quests = len(quests)
    completed_quests = [q for q in quests if q["id"] in completed_ids]
    failed_quests = [q for q in quests if q["id"] not in completed_ids]

    # XP gained from completed quests (if not already awarded, or tracking daily sum)
    daily_xp_gained = sum(q.get("xp_reward", 20) for q in completed_quests)

    # 1. Calculate Penalties (Rules §2.3)
    # Lose XP equal to 0.5 * quest's xp_reward for each failed quest
    failed_penalties = [math.floor(0.5 * q.get("xp_reward", 20)) for q in failed_quests]
    base_xp_penalty = sum(failed_penalties)

    # 2. Penalty Zone (Multi-fail state: 3 or more failed quests)
    penalty_zone_triggered = False
    extra_penalty = 0
    new_penalty_zone_active = penalty_zone_active

    if len(failed_quests) >= 3:
        penalty_zone_triggered = True
        new_penalty_zone_active = True
        extra_penalty = 20 # Flat extra penalty of 20

    total_xp_penalty = base_xp_penalty + extra_penalty

    # 3. Streaks & Redemption (Rules §2.3 & 2.5)
    new_streak = current_streak
    new_longest_streak = longest_streak
    new_redemption = redemption_progress
    redemption_cleared = False
    redemption_bonus = 0
    streak_broken = False
    streak_xp_penalty = 0

    if len(failed_quests) == 0 and total_quests > 0:
        # Successful day with zero failed quests
        new_streak += 1
        new_longest_streak = max(new_longest_streak, new_streak)

        if new_penalty_zone_active:
            new_redemption += 1
            if new_redemption >= 3:
                # 3 consecutive days of 100% completion clears Penalty Zone
                new_penalty_zone_active = False
                redemption_cleared = True
                new_redemption = 0
                redemption_bonus = 15 # +15 XP Comeback Bonus
    else:
        # Any failure breaks the streak to 0
        if current_streak > 0:
            streak_broken = True
            streak_xp_penalty = DEFAULT_STREAK_PENALTY
        new_streak = 0
        new_redemption = 0

    total_xp_penalty = base_xp_penalty + extra_penalty + streak_xp_penalty

    # 4. XP and Level Resolution
    net_xp_change = (daily_xp_gained + redemption_bonus) - total_xp_penalty
    tentative_xp = current_xp + net_xp_change

    stat_points_granted = 0
    level = current_level
    demoted = False

    if tentative_xp < 0:
        level, tentative_xp, demoted = check_level_demotion(level, tentative_xp)
    else:
        level, tentative_xp, stat_points_granted = check_level_up(level, tentative_xp)

    rank = derive_rank(level)

    return {
        "total_quests": total_quests,
        "completed_count": len(completed_quests),
        "failed_count": len(failed_quests),
        "xp_gained": daily_xp_gained,
        "xp_lost": total_xp_penalty,
        "base_xp_penalty": base_xp_penalty,
        "extra_penalty": extra_penalty,
        "streak_xp_penalty": streak_xp_penalty,
        "streak_broken": streak_broken,
        "redemption_bonus": redemption_bonus,
        "net_xp_change": net_xp_change,
        "level_before": current_level,
        "level_after": level,
        "xp_before": current_xp,
        "xp_after": tentative_xp,
        "stat_points_granted": stat_points_granted,
        "demoted": demoted,
        "streak_before": current_streak,
        "streak_after": new_streak,
        "longest_streak": new_longest_streak,
        "penalty_zone_triggered": penalty_zone_triggered,
        "penalty_zone_active": new_penalty_zone_active,
        "redemption_progress": new_redemption,
        "redemption_cleared": redemption_cleared,
        "rank": rank,
    }
