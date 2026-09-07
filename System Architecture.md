# Architecture

## 1. Architecture Overview

SoloQuest follows a decoupled client-server architecture.

```text
┌──────────────────────┐
│      React App       │
│      Frontend        │
└──────────┬───────────┘
           │ HTTPS / JSON
           ▼
┌──────────────────────┐
│      FastAPI         │
│       Backend        │
├──────────────────────┤
│ Authentication       │
│ Quest Services       │
│ XP Engine            │
│ Stat Engine           │
│ Level Engine          │
│ Streak Engine         │
│ Rank Engine           │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│     PostgreSQL       │
│       Database       │
└──────────────────────┘
```

---

## 2. Frontend

### Technology

- React.
- TypeScript.
- React Router.
- Context API or Redux/Zustand for state management.
- CSS framework or custom design system.

### Responsibilities

The frontend handles:

- User interface.
- Client-side navigation.
- Form interactions.
- Local UI state.
- API communication.
- Displaying progression.
- Loading/error states.

The frontend must not be responsible for authoritative game calculations.

---

## 3. Backend

### Technology

**FastAPI + Python**

FastAPI provides RESTful endpoints for the frontend.

### Responsibilities

The backend handles:

- Authentication.
- Authorization.
- User management.
- Quest management.
- Quest completion.
- XP calculation.
- Stat updates.
- Level calculation.
- Rank calculation.
- Streak calculation.
- Data validation.
- Database access.

---

## 4. API Layer

Suggested API structure:

```text
/api/v1
│
├── /auth
│   ├── POST /register
│   ├── POST /login
│   └── POST /refresh
│
├── /users
│   ├── GET /me
│   └── PATCH /me
│
├── /quests
│   ├── GET /
│   ├── POST /
│   ├── GET /{id}
│   ├── PATCH /{id}
│   └── DELETE /{id}
│
├── /quest-completions
│   └── POST /{quest_id}/complete
│
├── /progression
│   ├── GET /
│   └── GET /history
│
└── /stats
    └── GET /
```

---

## 5. Service Layer

Business logic should be separated from API route handlers.

Suggested structure:

```text
backend/
├── app/
│   ├── main.py
│   │
│   ├── api/
│   │   └── routes/
│   │
│   ├── models/
│   │
│   ├── schemas/
│   │
│   ├── services/
│   │   ├── quest_service.py
│   │   ├── xp_service.py
│   │   ├── stat_service.py
│   │   ├── level_service.py
│   │   ├── streak_service.py
│   │   └── rank_service.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   └── security.py
│   │
│   └── db/
│       ├── database.py
│       └── migrations/
│
└── tests/
```

This separation makes game logic easier to test and modify.

---

## 6. Database

### Recommended Database

**PostgreSQL**

PostgreSQL stores:

- User accounts.
- User statistics.
- Quests.
- Quest completions.
- XP transactions.
- Stat transactions.
- Achievements.
- Progression data.

An ORM such as SQLAlchemy can be used for database interaction.

---

## 7. Authentication

JWT-based authentication can be used.

Flow:

```text
User
 ↓
Login
 ↓
FastAPI
 ↓
Validate Credentials
 ↓
Generate Access Token
 ↓
React Stores Token Securely
 ↓
Authenticated API Requests
```

Passwords must be securely hashed using a modern password-hashing algorithm.

Protected API endpoints must validate the user's identity and permissions.

---

## 8. Quest Completion Transaction

Quest completion is a critical backend operation.

Recommended flow:

```text
POST /quests/{id}/complete
            │
            ▼
      Authenticate User
            │
            ▼
       Validate Quest
            │
            ▼
   Check Duplicate Completion
            │
            ▼
     Create Completion
            │
            ▼
       Award XP
            │
            ▼
       Update Stats
            │
            ▼
    Recalculate Streak
            │
            ▼
    Recalculate Level
            │
            ▼
     Recalculate Rank
            │
            ▼
      Commit Transaction
            │
            ▼
       Return Result
```

All related database modifications should occur within a transaction.

---

## 9. XP Engine

The XP engine should be implemented as backend business logic.

Example:

```text
Quest XP
   +
Streak Bonus
   +
Achievement Bonus
   -
Penalties
   =
Final XP Change
```

The resulting change is recorded in the XP transaction table.

---

## 10. Frontend–Backend Communication

Communication uses HTTPS and JSON.

Example:

```http
POST /api/v1/quest-completions/Q123/complete
Authorization: Bearer <token>
```

Example response:

```json
{
  "quest_id": "Q123",
  "status": "completed",
  "xp_gained": 25,
  "level": 18,
  "current_xp": 4250,
  "stat_updates": {
    "intelligence": 1
  },
  "streak": 7
}
```

---

## 11. Security Architecture

Security controls should include:

- HTTPS.
- Password hashing.
- JWT authentication.
- Authorization checks.
- Request validation.
- Rate limiting where appropriate.
- Secure environment variables.
- Database access controls.
- CORS configuration.
- Audit-friendly XP transactions.

Client-provided XP, level, rank, and statistics must never be trusted as authoritative values.

---

## 12. Deployment Architecture

A containerized deployment can use:

```text
                 Internet
                    │
                    ▼
              Reverse Proxy
               /          \
              ▼            ▼
        React Frontend   FastAPI
                            │
                            ▼
                       PostgreSQL
```

Docker can be used to package the application components consistently across development, staging, and production environments.

---

## 13. Observability

The production system should provide:

- Application logs.
- API error tracking.
- Database monitoring.
- Health checks.
- Performance monitoring.
- Authentication/security logs.

A dedicated health endpoint can be exposed:

```text
GET /health
```

Example response:

```json
{
  "status": "healthy"
}
```

---

## 14. Scalability

The initial system can use a single FastAPI deployment and PostgreSQL instance.

As usage increases, the architecture can evolve to:

```text
Load Balancer
      │
 ┌────┼────┐
 ▼    ▼    ▼
API  API  API
 │    │    │
 └────┼────┘
      ▼
 PostgreSQL
```

Caching, background workers, and read replicas can be introduced when justified by actual performance requirements.

---

## 15. Architectural Principles

The implementation should follow:

1. **Separation of concerns** — UI, API, business logic, and persistence remain distinct.
2. **Backend authority** — progression calculations are server-controlled.
3. **Modularity** — game systems are implemented as independent services.
4. **Testability** — core rules can be tested without the UI.
5. **Security by design** — authentication and authorization are enforced at the API layer.
6. **Scalability** — components can be independently scaled.
7. **Auditability** — XP and stat changes are represented as transactions.
8. **Configuration over hardcoding** — game-balance values should be configurable.