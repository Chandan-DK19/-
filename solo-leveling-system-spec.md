# PROJECT: THE SYSTEM
### A Solo Leveling–inspired gamified habit tracker
Owner: Chandan DK · Build tool: Antigravity · Doc type: Master spec (PRD + Rules + Phases + Memory + Design + Architecture)

> This file is meant to be dropped into Antigravity as the project's grounding context. Every section below is written to be actionable by an AI coding agent, not just descriptive.

---

## 1. PRD — Product Requirements Document

### 1.1 Vision
A personal web app that turns daily self-improvement into an RPG. Like the System in *Solo Leveling*, the app assigns the user daily quests, tracks completion, awards XP, and forces consequences (penalties) for skipped quests — so consistency has both a reward and a real cost.

### 1.2 Problem
Normal habit trackers (checklists, streak counters) are low-stakes — missing a day just leaves a blank box. There's no "penalty," no growth narrative, no sense of becoming stronger. The user wants pressure and progression, not just a log.

### 1.3 Target user
Single user (Chandan) for v1 — a self-improvement tool for one "Hunter." Architecture should allow multi-user later, but v1 = local single-profile.

### 1.4 Core features (v1 scope)
| Feature | Description |
|---|---|
| Daily Quests | A fixed or semi-fixed list of daily tasks (workout, study, coding, reading, etc.), each with a target (e.g., "Study 1 hr"). |
| Quest Check-in | Mark a quest complete/incomplete for the day. |
| XP & Leveling | Completing quests grants XP. Enough XP → Level Up. |
| Stats (RPG attributes) | Quests map to stats (STR, INT, VIT, AGI, SENSE). Completing a quest raises its linked stat. |
| Penalty System | Missed quests deduct XP / stat points, and trigger a "Penalty Zone" state (see Rules §2.3). |
| Rank System | E → D → C → B → A → S rank, derived from level/total stats. |
| Daily Reset & System Notification | At day rollover, unfinished quests are judged, XP/penalty applied, a "[Notification]" style summary is shown. |
| Weekly/Monthly Stats | Charts: completion %, XP over time, stat growth, streak history. |
| Quest Log / History | Timeline of past days, what was done/missed. |

### 1.5 Out of scope for v1
- Multi-user accounts / social features / leaderboards
- Mobile app (web-responsive only)
- Real notifications/push (in-app only for v1)
- Monetization

### 1.6 Success criteria
- User opens the app daily and checks in quests without friction (< 10 sec per quest).
- Missing a quest is felt — the penalty and score drop must be visible immediately, not buried.
- Weekly stats page clearly answers "was I consistent this week?" in one glance.

---

## 2. Rules — The System's Game Logic

This is the actual "rulebook" the System enforces. Treat this section as the source of truth for all logic — the app should not deviate from it without the user updating this doc first.

### 2.1 Quests
- Each quest has: `name`, `stat_link` (STR/INT/VIT/AGI/SENSE), `difficulty` (Easy/Normal/Hard), `xp_reward`, `is_daily` (bool).
- Default XP reward by difficulty: Easy = 10, Normal = 20, Hard = 35.
- A quest is either **Completed** or **Failed** for the day — no partial credit in v1.

### 2.2 XP & Leveling
- XP required for next level: `xp_to_next = 100 * current_level^1.35` (rounded up). This gives a gentle early curve and a steeper late-game curve, similar to the manhwa's slow-grind-then-power-spike feel.
- Leveling up fully refills nothing but grants a **Stat Point** to allocate manually to one of the 5 stats (small player-agency moment, like the System's stat window).
- Level and XP persist permanently — leveling down never happens from normal play, only from penalties (see below).

### 2.3 Penalty System ⚠️ (core requested rule)
- **Trigger:** At daily rollover, any quest still marked incomplete is judged FAILED.
- **Penalty per failed quest:**
  - XP penalty: lose XP equal to `0.5 × that quest's xp_reward`.
  - Stat penalty: the linked stat's daily "training progress" resets to 0 (does not go below its permanent floor).
- **Penalty Zone (multi-fail state):** if the user fails **3 or more quests in the same day**, trigger "Penalty Zone":
  - An extra flat XP penalty of 20.
  - The next day's quests are shown with a red "PENALTY ACTIVE" banner until the user completes at least one quest.
- **Level-down floor:** XP can drop below the current level's threshold, but a level only *decreases* if XP goes negative relative to the previous level's requirement — i.e., sustained failure can demote you a level. This mirrors real stakes without being punishing for a single bad day.
- **Redemption rule:** Completing every quest for 3 consecutive days after a Penalty Zone clears the "PENALTY ACTIVE" banner and grants a one-time +15 XP "Comeback Bonus."

### 2.4 Rank System
Derived from Level, not manually chosen:
| Rank | Level range |
|---|---|
| E | 1–9 |
| D | 10–19 |
| C | 20–34 |
| B | 35–49 |
| A | 50–69 |
| S | 70+ |

### 2.5 Streaks
- Streak = consecutive days with **zero** failed quests.
- One failed quest breaks the streak to 0, regardless of Penalty Zone status.

### 2.6 Daily rollover
- Rollover happens at a fixed local time (default: midnight, user-configurable in settings).
- On rollover: judge yesterday's quests → apply XP/penalties → generate today's quest list → log a `DailyRecord`.

---

## 3. Phases — Build Roadmap

Written as sequential milestones for Antigravity to execute one at a time. Each phase should be fully working and demo-able before moving to the next.

### Phase 0 — Setup
- Initialize repo, folder structure (see Architecture §6).
- Set up frontend scaffold + backend scaffold + local database.
- Empty "System boot" screen that just renders the app shell.

### Phase 1 — Core Quest Loop
- Create/edit/delete quests (CRUD).
- Daily quest list view with tick/complete toggle.
- Manual "End Day" trigger (rollover logic, before automating it).
- Basic XP gain on completion, level counter (no penalties yet).

### Phase 2 — Gamification Layer
- Implement full Rules §2 logic: XP curve, stat points, penalties, Penalty Zone, rank system, streaks.
- Level-up modal ("System" style pop-up).
- Stat allocation screen.

### Phase 3 — Stats & History
- Weekly/monthly charts (completion %, XP trend, stat growth).
- Quest history/log timeline.
- Automatic daily rollover (scheduled, not manual).

### Phase 4 — Design Pass
- Apply full Arise-inspired visual identity (see Design §5).
- Notification-window component for all System messages (level up, penalty, quest complete).
- Responsive pass (mobile browser usability).

### Phase 5 — Polish & Deploy
- Settings (rollover time, quest editing rules, data export/reset).
- Error/empty states in System voice (see Design §5.5).
- Deploy (Vercel/Render/Netlify — pick free tier), backup/export of data.

---

## 4. Memory — Data Model & Persistence

*(This doubles as the persistent state schema for the app, and can be used as Antigravity's ongoing project memory/context.)*

### 4.1 Core entities
```
Hunter (single-user profile)
├─ level: int
├─ current_xp: int
├─ rank: enum(E,D,C,B,A,S)          # derived, not stored as source of truth
├─ stats: { STR, INT, VIT, AGI, SENSE } (int each)
├─ streak_count: int
├─ penalty_zone_active: bool
├─ redemption_progress: int (0-3)
└─ settings: { rollover_time }

Quest
├─ id
├─ name
├─ stat_link: enum(STR,INT,VIT,AGI,SENSE)
├─ difficulty: enum(Easy,Normal,Hard)
├─ xp_reward: int
├─ is_daily: bool
└─ active: bool

DailyRecord (one per day, generated at rollover)
├─ date
├─ quests_snapshot: [ {quest_id, completed: bool} ]
├─ xp_change: int
├─ penalties_applied: [ ... ]
├─ streak_after: int
└─ level_after: int

LevelHistory (append-only log)
├─ date
├─ level
└─ trigger: enum(level_up, level_down)
```

### 4.2 Persistence rules
- `Hunter` is a singleton row (v1 = one user).
- `DailyRecord` is immutable once written — corrections happen via new adjustment entries, not edits, so history stays honest (true to "the System doesn't lie" theme).
- All XP/stat/penalty math (Rules §2) lives in one backend module (`system_engine`) — never duplicated in the frontend, so the frontend only ever displays what the engine computed.

### 4.3 Storage choice
- v1: SQLite (single file, zero-config, fits single-user scope) via the backend.
- Migration path: swap to Postgres later without changing the data model if multi-user is ever added.

---

## 5. Design — Visual Identity (Arise-inspired)

Reference: *Solo Leveling: Arise*'s in-game "System" UI — dark, holographic, blue-and-violet glow, sharp geometric panels, notification windows that feel like they're floating in front of a dark void.

### 5.1 Palette
| Token | Hex | Use |
|---|---|---|
| `void-black` | #05070D | Base background |
| `deep-navy` | #0B1220 | Panel backgrounds |
| `system-blue` | #4FD8FF | Primary glow, active states, XP bar |
| `arise-violet` | #7B5CFA | Secondary accent, level-up moments |
| `warning-red` | #FF3B4E | Penalty states, failed quests |
| `ash-white` | #E7ECF5 | Body text |
| `muted-slate` | #6C7A94 | Secondary text, disabled states |

### 5.2 Typography
- Display/headers: a sharp, slightly futuristic sans (e.g., "Rajdhani" or "Orbitron"-family) — used sparingly for rank letters, level numbers, and "SYSTEM" labels.
- Body: a clean readable sans (e.g., "Inter") for quest names, descriptions, settings — futuristic display type gets unreadable at body sizes, so don't use it there.

### 5.3 Layout concept
```
┌─────────────────────────────────────┐
│  [Rank: E]   HUNTER: Chandan   Lv 7  │  ← status bar, glowing thin border
├─────────────────────────────────────┤
│  XP ████████░░░░░░░░  1,240 / 2,100  │  ← XP bar, system-blue glow
├─────────────────────────────────────┤
│  TODAY'S QUESTS                      │
│  ▸ [ ] Workout            +20 XP     │
│  ▸ [x] Read 20 pages      +10 XP     │
│  ▸ [ ] DSA practice       +35 XP     │
├─────────────────────────────────────┤
│  STR 12  INT 18  VIT 9  AGI 7  SNS 5 │  ← stat block, small panel
└─────────────────────────────────────┘
```
- Center-aligned single-column layout on mobile; on desktop, quests + XP take the main column, stats + streak live in a right sidebar panel.
- Panels use thin 1px glowing borders (`system-blue` at low opacity) on `deep-navy` backgrounds, not rounded SaaS cards — sharp corners or single-corner-clipped ("cyber-panel") shapes feel more System-like than default border-radius cards.

### 5.4 Key interaction moments
- **Quest complete:** checkbox fills with `system-blue`, brief glow pulse, small "+XP" floats up and fades — one deliberate animation, not decoration on every element.
- **Level up:** full-screen dim + centered "System window" pop-up: "LEVEL UP! You are now Level 8." with a violet glow border.
- **Penalty triggered:** the same notification-window pattern but in `warning-red`: "[Notification] Penalty applied. -15 XP. VIT training reset."
- **Penalty Zone active:** persistent red banner at the top of the dashboard until cleared.

### 5.5 Writing/voice
- All system messages speak as "the System," not as a person: declarative, factual, no apologies. E.g., empty quest list → "No active quests. Add a quest to begin." Not "Oops, looks like you don't have any quests yet!"

---

## 6. Architecture

### 6.1 Stack
- **Frontend:** React (Vite) + Tailwind CSS — matches the sharp-panel/glow design system well via utility classes; component-based fits the reusable "System window" pattern.
- **Backend:** Python + FastAPI — matches existing Python fluency, keeps the `system_engine` (Rules §2 math) in one typed, testable module.
- **Database:** SQLite (file-based) via SQLAlchemy ORM.
- **Charts:** Recharts (weekly/monthly stats).
- **Scheduling (daily rollover):** APScheduler running inside the FastAPI process, or a simple cron-triggered endpoint if hosting doesn't support background jobs.
- **Hosting (free tier):** Frontend on Vercel/Netlify, backend on Render/Railway free tier.

### 6.2 Folder structure
```
solo-leveling-system/
├─ backend/
│  ├─ app/
│  │  ├─ main.py                # FastAPI entrypoint
│  │  ├─ models.py               # SQLAlchemy models (Hunter, Quest, DailyRecord, LevelHistory)
│  │  ├─ schemas.py              # Pydantic schemas
│  │  ├─ system_engine.py        # ALL Rules §2 logic lives here — XP, penalties, leveling, rank
│  │  ├─ routers/
│  │  │  ├─ quests.py
│  │  │  ├─ hunter.py
│  │  │  └─ history.py
│  │  └─ scheduler.py            # daily rollover job
│  └─ tests/
│     └─ test_system_engine.py   # unit tests for XP/penalty math — critical, since this is the game's fairness
├─ frontend/
│  ├─ src/
│  │  ├─ components/
│  │  │  ├─ SystemWindow.jsx     # reusable notification/modal panel
│  │  │  ├─ QuestList.jsx
│  │  │  ├─ XPBar.jsx
│  │  │  ├─ StatBlock.jsx
│  │  │  └─ PenaltyBanner.jsx
│  │  ├─ pages/
│  │  │  ├─ Dashboard.jsx
│  │  │  ├─ Stats.jsx
│  │  │  ├─ QuestManager.jsx
│  │  │  └─ Settings.jsx
│  │  └─ api/                    # fetch wrappers to backend
│  └─ tailwind.config.js         # palette tokens from Design §5.1 defined here
└─ SYSTEM_SPEC.md                # this file
```

### 6.3 Data flow
1. Frontend loads `Hunter` + today's `Quest` list from backend on mount.
2. User ticks a quest → `PATCH /quests/{id}/complete` → backend updates in-memory today's state (not yet scored).
3. At rollover (scheduled or manual "End Day" in Phase 1), backend calls `system_engine.judge_day()`:
   - Reads today's quest completion state.
   - Applies XP gains, penalties, streak/rank updates per Rules §2.
   - Writes a `DailyRecord`, updates `Hunter`, appends `LevelHistory` if level changed.
4. Frontend polls/refetches `Hunter` state and renders System notifications for whatever changed (level up / penalty / streak).

### 6.4 Testing priority
`system_engine.py` is the one module that must be unit-tested thoroughly — it's the entire "fairness" of the game (Rules §2.2–2.3 math). Everything else (UI, routing) can be tested more loosely.
