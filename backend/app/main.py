from fastapi import FastAPI

from app.database.database import engine
from app.database.base import Base

# Import all models so SQLAlchemy registers them
from app.models.memory import Memory
from app.models.patients import Patient
from app.models.generated_game import GeneratedGame
from app.models.game_attempt import GameAttempt
from app.models.user import User

# Import routers
from app.api.memories import router as memories_router
from app.api.games import router as games_router
from app.api.patients import router as patient_router
from app.api.auth import router as auth_router

# Create all database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smriti AI Backend",
    version="1.0.0"
)

# Register routers
app.include_router(memories_router)
app.include_router(games_router)
app.include_router(patient_router)
app.include_router(auth_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Smriti AI Backend 🚀"
    }


@app.get("/health")
def health():
    return {
        "status": "healthy"
    }