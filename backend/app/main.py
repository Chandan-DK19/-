from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import Hunter, Quest
from .routers import hunter, quests, history

def init_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        from sqlalchemy import text
        try:
            db.execute(text("ALTER TABLE hunters ADD COLUMN last_login_date VARCHAR(20)"))
            db.commit()
        except Exception:
            db.rollback()

        existing_hunter = db.query(Hunter).first()
        if not existing_hunter:
            initial_hunter = Hunter(
                username="Chandan DK",
                title="The Awakened Hunter",
                level=1,
                current_xp=0,
                unallocated_stat_points=0,
                str_stat=10,
                int_stat=10,
                vit_stat=10,
                agi_stat=10,
                sense_stat=10,
                streak_count=0,
                longest_streak=0,
                penalty_zone_active=False,
                redemption_progress=0,
            )
            db.add(initial_hunter)

        quest_count = db.query(Quest).count()
        if quest_count == 0:
            starter_quests = [
                Quest(title="Gym", description="Hit the gym — strength training, hypertrophy, or progressive overload session", stat_link="STR", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
                Quest(title="Water (4L per day)", description="Drink a full 4 liters of clean water throughout the day", stat_link="VIT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
                Quest(title="Sleep (7 hr)", description="Attain at least 7 hours of uninterrupted quality sleep", stat_link="VIT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
                Quest(title="Learn something new", description="Acquire fresh knowledge, read new literature, or study an unfamiliar concept", stat_link="INT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
                Quest(title="Revise", description="Review past study material, notes, algorithms, or concepts for active recall", stat_link="INT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
                Quest(title="Wakeup (6 am)", description="Wake up promptly at 6:00 AM without hitting snooze", stat_link="SENSE", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
                Quest(title="Sleep (11 pm)", description="Lights out and sleep by 11:00 PM sharp to secure recovery", stat_link="SENSE", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
                Quest(title="Diet goal (2700 kcal)", description="Hit the daily caloric target of 2,700 kcal for clean energy & muscle growth", stat_link="VIT", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
                Quest(title="Protein diet (150gm)", description="Consume 150 grams of dietary protein for muscle repair and synthesis", stat_link="STR", difficulty="Normal", xp_reward=20, is_daily=True, active=True),
                Quest(title="Save 5rs daily for MF", description="Set aside ₹5 daily investment contribution into Mutual Funds", stat_link="AGI", difficulty="Easy", xp_reward=10, is_daily=True, active=True),
            ]
            db.add_all(starter_quests)

        db.commit()
    finally:
        db.close()

# Ensure tables are ready
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    title="SoloQuest: The System API",
    description="Backend API for Solo Leveling-inspired gamified habit tracker",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(hunter.router)
app.include_router(quests.router)
app.include_router(history.router)

@app.get("/health")
def health_check():
    return {"status": "healthy", "system": "ONLINE"}

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

FRONTEND_DIST = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))), "frontend", "dist")

if os.path.exists(FRONTEND_DIST):
    assets_dir = os.path.join(FRONTEND_DIST, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def serve_root():
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"name": "SoloQuest: The System", "status": "OPERATIONAL", "docs": "/docs"}

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        file_path = os.path.join(FRONTEND_DIST, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(FRONTEND_DIST, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)
        return {"error": "Not found"}
else:
    @app.get("/")
    def root():
        return {
            "name": "SoloQuest: The System",
            "status": "OPERATIONAL",
            "docs": "/docs"
        }

