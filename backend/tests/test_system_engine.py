import pytest
from app.system_engine import (
    derive_rank,
    xp_required_for_next_level,
    check_level_up,
    check_level_demotion,
    calculate_daily_evaluation,
    calculate_missed_login_penalties,
    MISSED_LOGIN_PENALTY,
)

def test_derive_rank():
    assert derive_rank(1) == "E"
    assert derive_rank(9) == "E"
    assert derive_rank(10) == "D"
    assert derive_rank(19) == "D"
    assert derive_rank(20) == "C"
    assert derive_rank(34) == "C"
    assert derive_rank(35) == "B"
    assert derive_rank(49) == "B"
    assert derive_rank(50) == "A"
    assert derive_rank(69) == "A"
    assert derive_rank(70) == "S"
    assert derive_rank(100) == "S"

def test_xp_curve():
    # Level 1: 100 * 1^1.35 = 100
    assert xp_required_for_next_level(1) == 100
    # Level 2: 100 * 2^1.35 = 254.91 -> 255
    assert xp_required_for_next_level(2) == 255
    # Level 3: 100 * 3^1.35 = 440.6 -> 441
    assert xp_required_for_next_level(3) == 441

def test_check_level_up_single_and_multi():
    # Level 1 requires 100 XP
    # If hunter has 150 XP: levels up to 2, remaining 50 XP, 1 stat point
    new_lvl, rem_xp, pts = check_level_up(1, 150)
    assert new_lvl == 2
    assert rem_xp == 50
    assert pts == 1

    # Level 1 requires 100, Level 2 requires 255 (Total 355)
    # If hunter has 400 XP: levels up to 3, remaining 45 XP, 2 stat points
    new_lvl, rem_xp, pts = check_level_up(1, 400)
    assert new_lvl == 3
    assert rem_xp == 45
    assert pts == 2

def test_check_level_demotion():
    # Level 1 with negative XP floors at 0 and remains level 1
    lvl, xp, demoted = check_level_demotion(1, -50)
    assert lvl == 1
    assert xp == 0
    assert not demoted

    # Level 2 with negative XP (-20) demotes to Level 1
    # Level 1 requires 100 XP, so 100 + (-20) = 80 XP
    lvl, xp, demoted = check_level_demotion(2, -20)
    assert lvl == 1
    assert xp == 80
    assert demoted

def test_daily_evaluation_all_completed():
    quests = [
        {"id": 1, "title": "Workout", "xp_reward": 20},
        {"id": 2, "title": "Study DSA", "xp_reward": 35},
    ]
    completed_ids = [1, 2]
    res = calculate_daily_evaluation(
        current_level=1,
        current_xp=50,
        current_streak=4,
        longest_streak=5,
        penalty_zone_active=False,
        redemption_progress=0,
        quests=quests,
        completed_ids=completed_ids
    )

    assert res["completed_count"] == 2
    assert res["failed_count"] == 0
    assert res["xp_gained"] == 55
    assert res["xp_lost"] == 0
    assert res["streak_after"] == 5
    assert res["longest_streak"] == 5
    assert not res["penalty_zone_active"]
    # 50 + 55 = 105 XP -> Level 1 requires 100 XP -> Level 2 with 5 XP, 1 stat point!
    assert res["level_after"] == 2
    assert res["xp_after"] == 5
    assert res["stat_points_granted"] == 1

def test_daily_evaluation_single_failure_breaks_streak():
    quests = [
        {"id": 1, "title": "Workout", "xp_reward": 20},
        {"id": 2, "title": "Study DSA", "xp_reward": 30},
    ]
    completed_ids = [1] # quest 2 failed
    res = calculate_daily_evaluation(
        current_level=1,
        current_xp=50,
        current_streak=7,
        longest_streak=10,
        penalty_zone_active=False,
        redemption_progress=0,
        quests=quests,
        completed_ids=completed_ids
    )

    assert res["completed_count"] == 1
    assert res["failed_count"] == 1
    assert res["xp_gained"] == 20
    # Failed quest 2: 0.5 * 30 = 15 base XP penalty + 25 streak penalty = 40
    assert res["base_xp_penalty"] == 15
    assert res["streak_xp_penalty"] == 25
    assert res["xp_lost"] == 40
    assert res["net_xp_change"] == -20
    assert res["streak_after"] == 0 # Streak broken
    assert res["longest_streak"] == 10
    assert not res["penalty_zone_active"]

def test_daily_evaluation_penalty_zone_activation():
    quests = [
        {"id": 1, "title": "Quest 1", "xp_reward": 20},
        {"id": 2, "title": "Quest 2", "xp_reward": 20},
        {"id": 3, "title": "Quest 3", "xp_reward": 20},
    ]
    completed_ids = [] # 3 failed quests!
    res = calculate_daily_evaluation(
        current_level=2,
        current_xp=50,
        current_streak=3,
        longest_streak=3,
        penalty_zone_active=False,
        redemption_progress=0,
        quests=quests,
        completed_ids=completed_ids
    )

    assert res["failed_count"] == 3
    assert res["penalty_zone_triggered"]
    assert res["penalty_zone_active"]
    # base penalty: 3 * (0.5 * 20) = 30
    # extra penalty: 20
    # streak penalty: 25
    # total lost: 75
    assert res["base_xp_penalty"] == 30
    assert res["extra_penalty"] == 20
    assert res["streak_xp_penalty"] == 25
    assert res["xp_lost"] == 75
    assert res["streak_after"] == 0

def test_daily_evaluation_redemption_clears_penalty_zone():
    quests = [{"id": 1, "title": "Quest 1", "xp_reward": 20}]
    completed_ids = [1]

    # Day 1 of redemption
    res1 = calculate_daily_evaluation(1, 0, 0, 0, True, 0, quests, completed_ids)
    assert res1["penalty_zone_active"]
    assert res1["redemption_progress"] == 1

    # Day 2 of redemption
    res2 = calculate_daily_evaluation(1, res1["xp_after"], res1["streak_after"], 0, True, 1, quests, completed_ids)
    assert res2["penalty_zone_active"]
    assert res2["redemption_progress"] == 2

    # Day 3 of redemption -> Cleared + Comeback Bonus!
    res3 = calculate_daily_evaluation(1, res2["xp_after"], res2["streak_after"], 0, True, 2, quests, completed_ids)
    assert not res3["penalty_zone_active"]
    assert res3["redemption_cleared"]
    assert res3["redemption_progress"] == 0
    assert res3["redemption_bonus"] == 15

# Missed Login Penalty Tests
def test_missed_login_penalty_single_day():
    # Logged in on 2026-09-04, accessing on 2026-09-06 -> 1 missed day (2026-09-05)
    res = calculate_missed_login_penalties(
        last_login_date_str="2026-09-04",
        current_date_str="2026-09-06",
        current_level=1,
        current_xp=50,
        current_streak=5,
    )
    assert res["missed_days_count"] == 1
    assert res["missed_dates"] == ["2026-09-05"]
    assert res["total_xp_penalty"] == MISSED_LOGIN_PENALTY # 25 XP
    assert res["xp_after"] == 25
    assert res["streak_after"] == 0
    assert res["streak_broken"] is True
    assert res["demoted"] is False

def test_missed_login_penalty_multi_day_with_demotion():
    # Logged in on 2026-09-01, accessing on 2026-09-05 -> 3 missed days (09-02, 09-03, 09-04)
    # Penalty: 3 * 25 = 75 XP
    # Level 2 with 30 XP -> 30 - 75 = -45 XP -> Demoted to Level 1!
    # Level 1 requires 100 XP, 100 - 45 = 55 XP
    res = calculate_missed_login_penalties(
        last_login_date_str="2026-09-01",
        current_date_str="2026-09-05",
        current_level=2,
        current_xp=30,
        current_streak=10,
    )
    assert res["missed_days_count"] == 3
    assert res["missed_dates"] == ["2026-09-02", "2026-09-03", "2026-09-04"]
    assert res["total_xp_penalty"] == 75
    assert res["demoted"] is True
    assert res["level_after"] == 1
    assert res["xp_after"] == 55
    assert res["streak_after"] == 0

def test_missed_login_consecutive_and_same_day():
    # Consecutive days: 2026-09-05 -> 2026-09-06 (no missed days)
    res_consec = calculate_missed_login_penalties(
        last_login_date_str="2026-09-05",
        current_date_str="2026-09-06",
        current_level=2,
        current_xp=50,
        current_streak=3,
    )
    assert res_consec["missed_days_count"] == 0
    assert res_consec["total_xp_penalty"] == 0
    assert res_consec["xp_after"] == 50
    assert res_consec["streak_after"] == 3

    # Same day: 2026-09-06 -> 2026-09-06
    res_same = calculate_missed_login_penalties(
        last_login_date_str="2026-09-06",
        current_date_str="2026-09-06",
        current_level=2,
        current_xp=50,
        current_streak=3,
    )
    assert res_same["missed_days_count"] == 0
    assert res_same["total_xp_penalty"] == 0

