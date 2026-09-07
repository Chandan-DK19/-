# Data Model

## 1. Overview

The application uses a relational data model to persist users, quests, completions, XP transactions, statistics, streaks, and progression.

Primary relationships:

```text
User
 │
 ├── UserStats
 │
 ├── Quests
 │     │
 │     └── QuestCompletions
 │
 ├── XPTransactions
 │
 └── Progression
```

---

## 2. User

Stores authentication and account information.

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique user identifier |
| username | String | Display name |
| email | String | Unique email |
| password_hash | String | Hashed password |
| created_at | DateTime | Account creation timestamp |
| updated_at | DateTime | Last update timestamp |

---

## 3. User Progression

Stores overall RPG progression.

| Field | Type | Description |
|---|---|---|
| user_id | UUID | User reference |
| level | Integer | Current level |
| total_xp | Integer | Lifetime/current XP |
| rank | String | Current rank |
| current_streak | Integer | Current streak |
| longest_streak | Integer | Highest recorded streak |

---

## 4. User Stats

Stores character attributes.

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique record |
| user_id | UUID | User reference |
| strength | Integer | STR |
| intelligence | Integer | INT |
| vitality | Integer | VIT |
| agility | Integer | AGI |
| discipline | Integer | DISC |
| updated_at | DateTime | Last update |

---

## 5. Quest

Represents a reusable habit/task definition.

| Field | Type | Description |
|---|---|---|
| id | UUID | Quest identifier |
| user_id | UUID | Quest owner |
| title | String | Quest name |
| description | Text | Quest description |
| difficulty | Enum | EASY/MEDIUM/HARD/EPIC |
| xp_reward | Integer | XP awarded |
| stat_type | Enum | Associated attribute |
| frequency | Enum | DAILY/WEEKLY/CUSTOM |
| active | Boolean | Whether quest is active |
| created_at | DateTime | Creation timestamp |

---

## 6. Quest Completion

Stores individual quest execution records.

| Field | Type | Description |
|---|---|---|
| id | UUID | Completion identifier |
| quest_id | UUID | Quest reference |
| user_id | UUID | User reference |
| scheduled_date | Date | Intended completion date |
| completed_at | DateTime | Completion timestamp |
| status | Enum | PENDING/COMPLETED/SKIPPED/FAILED |
| xp_awarded | Integer | XP granted |
| created_at | DateTime | Record creation time |

A unique constraint should prevent multiple successful completions of the same recurring quest for the same scheduled date.

---

## 7. XP Transaction

Stores every XP change.

| Field | Type | Description |
|---|---|---|
| id | UUID | Transaction identifier |
| user_id | UUID | User reference |
| amount | Integer | Positive or negative XP |
| transaction_type | Enum | QUEST/BONUS/PENALTY/ADMIN |
| reference_id | UUID | Related object |
| created_at | DateTime | Transaction timestamp |

The transaction table provides an auditable XP history.

---

## 8. Stat Transaction

Optional table for tracking individual statistic changes.

| Field | Type | Description |
|---|---|---|
| id | UUID | Transaction identifier |
| user_id | UUID | User reference |
| stat_type | Enum | STR/INT/VIT/AGI/DISC |
| amount | Integer | Change amount |
| reason | String | Explanation |
| reference_id | UUID | Related quest/event |
| created_at | DateTime | Timestamp |

---

## 9. Achievement

Stores unlocked achievements.

| Field | Type | Description |
|---|---|---|
| id | UUID | Achievement identifier |
| name | String | Achievement name |
| description | Text | Requirement description |
| xp_reward | Integer | Optional reward |

---

## 10. User Achievement

Maps users to achievements.

| Field | Type | Description |
|---|---|---|
| user_id | UUID | User reference |
| achievement_id | UUID | Achievement reference |
| unlocked_at | DateTime | Unlock timestamp |

A composite unique constraint should prevent duplicate achievement unlocks.

---

## 11. Relationships

```text
User 1 ──────── N Quest
User 1 ──────── 1 UserStats
User 1 ──────── 1 UserProgression
User 1 ──────── N QuestCompletion
Quest 1 ─────── N QuestCompletion
User 1 ──────── N XPTransaction
User 1 ──────── N StatTransaction
User N ──────── N Achievement
```

---

## 12. Data Integrity

The backend must enforce:

- Foreign-key constraints.
- Unique email addresses.
- Valid enum values.
- Non-negative levels.
- Valid XP transactions.
- Duplicate completion prevention.
- Authorized access to user-owned quests.
- Transactional updates for XP and statistics.

XP, level, and stat changes should be processed atomically to prevent partial updates.