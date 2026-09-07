import os
import sys

# Ensure backend directory is on sys.path
backend_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "backend")
sys.path.insert(0, backend_dir)

from app.database import SessionLocal
from app.models import Quest, QuestCompletion

NEW_QUESTS = [
    {
        "title": "Gym",
        "description": "Hit the gym — strength training, hypertrophy, or progressive overload session",
        "stat_link": "STR",
        "difficulty": "Normal",
        "xp_reward": 20,
    },
    {
        "title": "Water (4L per day)",
        "description": "Drink a full 4 liters of clean water throughout the day",
        "stat_link": "VIT",
        "difficulty": "Normal",
        "xp_reward": 20,
    },
    {
        "title": "Sleep (7 hr)",
        "description": "Attain at least 7 hours of uninterrupted quality sleep",
        "stat_link": "VIT",
        "difficulty": "Normal",
        "xp_reward": 20,
    },
    {
        "title": "Learn something new",
        "description": "Acquire fresh knowledge, read new literature, or study an unfamiliar concept",
        "stat_link": "INT",
        "difficulty": "Normal",
        "xp_reward": 20,
    },
    {
        "title": "Revise",
        "description": "Review past study material, notes, algorithms, or concepts for active recall",
        "stat_link": "INT",
        "difficulty": "Normal",
        "xp_reward": 20,
    },
    {
        "title": "Wakeup (6 am)",
        "description": "Wake up promptly at 6:00 AM without hitting snooze",
        "stat_link": "SENSE",
        "difficulty": "Normal",
        "xp_reward": 20,
    },
    {
        "title": "Sleep (11 pm)",
        "description": "Lights out and sleep by 11:00 PM sharp to secure recovery",
        "stat_link": "SENSE",
        "difficulty": "Normal",
        "xp_reward": 20,
    },
    {
        "title": "Diet goal (2700 kcal)",
        "description": "Hit the daily caloric target of 2,700 kcal for clean energy & muscle growth",
        "stat_link": "VIT",
        "difficulty": "Normal",
        "xp_reward": 20,
    },
    {
        "title": "Protein diet (150gm)",
        "description": "Consume 150 grams of dietary protein for muscle repair and synthesis",
        "stat_link": "STR",
        "difficulty": "Normal",
        "xp_reward": 20,
    },
    {
        "title": "Save 5rs daily for MF",
        "description": "Set aside ₹5 daily investment contribution into Mutual Funds",
        "stat_link": "AGI",
        "difficulty": "Easy",
        "xp_reward": 10,
    },
]

def update_quests():
    db = SessionLocal()
    try:
        # Delete old completions and quests
        db.query(QuestCompletion).delete()
        db.query(Quest).delete()

        # Insert the 10 new quests
        for item in NEW_QUESTS:
            q = Quest(
                title=item["title"],
                description=item["description"],
                stat_link=item["stat_link"],
                difficulty=item["difficulty"],
                xp_reward=item["xp_reward"],
                is_daily=True,
                active=True,
            )
            db.add(q)
        db.commit()
        print(f"Successfully seeded {len(NEW_QUESTS)} quests into the database.")
    finally:
        db.close()

if __name__ == "__main__":
    update_quests()
