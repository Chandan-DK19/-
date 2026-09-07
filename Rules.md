# Rules

## 1. Quest System

A quest represents a specific habit or task that the user is expected to complete.

Each quest contains:

- Unique identifier.
- Title.
- Description.
- Difficulty.
- XP reward.
- Associated statistic.
- Frequency.
- Due date.
- Status.

---

## 2. Quest Difficulty

Quests are categorized according to difficulty.

| Difficulty | Base XP |
|---|---:|
| Easy | 10 XP |
| Medium | 25 XP |
| Hard | 50 XP |
| Epic | 100 XP |

The values should be configurable rather than hardcoded into the frontend.

---

## 3. Quest Completion

When a quest is completed before its deadline:

1. The quest status becomes `COMPLETED`.
2. The configured XP reward is granted.
3. The associated statistic is increased.
4. The daily streak is updated.
5. Level progression is recalculated.
6. Rank eligibility is recalculated.

A quest must not grant XP multiple times for the same completion period.

---

## 4. XP Rules

### XP Sources

XP may be earned through:

- Quest completion.
- Bonus objectives.
- Streak milestones.
- Achievements.
- Special events.

### XP Transaction Principle

Every XP change should generate a transaction record.

Example:

```text
+25 XP
Reason: Completed "Study DSA"
Quest ID: Q-102
Timestamp: 2026-09-05 20:30
```

This allows XP history to be audited and prevents inconsistencies.

---

## 5. Streak Rules

A streak represents consecutive successful days.

### Starting a Streak

Completing an eligible quest on a day starts or continues the streak.

### Continuing a Streak

If the required daily activity is completed on consecutive days:

```text
Day 1 → Day 2 → Day 3 → Day 4
          ↑
      Continuous streak
```

### Breaking a Streak

A streak is broken when the user fails to meet the configured daily completion requirement.

The system should store the previous longest streak even after the current streak resets.

---

## 6. Penalty Rules

Penalties should encourage consistency without making the system excessively punishing.

A skipped eligible quest may result in:

- XP deduction.
- Stat reduction.
- Streak reset.
- Temporary status effects.

Example default penalty:

```text
Skipped quest:
-10 XP
-1 associated stat point
Streak reset if daily requirement is not met
```

Penalty values should be configurable by system administrators.

### XP Floor

XP should not normally fall below zero:

```text
new_xp = max(0, current_xp - penalty)
```

---

## 7. Stat Rules

Each quest may be associated with one or more statistics.

Example:

| Quest | Primary Stat |
|---|---|
| Gym workout | STR |
| Study session | INT |
| Sleep routine | VIT |
| Morning routine | DISC |
| Running | AGI |

### Completion

Successful completion may increase the associated stat.

Example:

```text
Complete Study Quest
→ +1 INT
→ +25 XP
```

### Failure

A configured penalty may decrease the associated stat.

Example:

```text
Skip Study Quest
→ -1 INT
→ XP penalty
```

Statistics should have configurable minimum and maximum values where required.

---

## 8. Leveling Rules

The user's level is determined by accumulated XP.

A configurable progression formula may be used:

```text
XP_required(level) = base_xp × level^growth_factor
```

When accumulated XP crosses the required threshold:

1. The user levels up.
2. The level is persisted.
3. A level-up event is generated.
4. Optional stat points or rewards are granted.

---

## 9. Rank Rules

Ranks are determined using a combination of progression and performance.

Example:

| Rank | Example Requirement |
|---|---|
| E | Starting rank |
| D | Level 5 |
| C | Level 10 |
| B | Level 20 |
| A | Level 35 |
| S | Level 50 |

Additional conditions such as completion rate or streak length may be introduced.

---

## 10. Anti-Abuse Rules

The system should prevent:

- Duplicate quest completion.
- Repeated XP claims.
- Manipulation of completion timestamps.
- Unauthorized XP modifications.
- Client-side modification of statistics.

All authoritative XP, level, stat, and completion calculations must be performed by the backend.

---

## 11. Rule Configuration

Game-balance values should be configurable.

Examples:

```text
quest_xp
penalty_xp
stat_reward
stat_penalty
level_thresholds
rank_thresholds
streak_bonus
```

This allows game mechanics to evolve without requiring frontend changes.