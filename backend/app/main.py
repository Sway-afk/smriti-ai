from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database.database import engine
from app.database.base import Base

# Import all models so SQLAlchemy registers them
from app.models.memory import Memory
from app.models.patients import Patient
from app.models.generated_game import GeneratedGame
from app.models.game_attempt import GameAttempt
from app.models.user import User
from app.models.therapy_session import TherapySession
from app.models.session_game import SessionGame

# Import routers
from app.api.memories import router as memories_router
from app.api.games import router as games_router
from app.api.patients import router as patient_router
from app.api.auth import router as auth_router
from app.api.therapy_sessions import router as therapy_sessions_router
from app.api.voice import router as voice_router
from app.api.tts import router as tts_router
from app.api.memory_dna import router as memory_dna_router
from app.api.caregiver import router as caregiver_router
from app.api.adaptive import router as adaptive_router


# Create all database tables
Base.metadata.create_all(bind=engine)


app = FastAPI(
    title="Smriti AI Backend",
    version="1.0.0"
)


# Allow frontend applications to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(memories_router)
app.include_router(games_router)
app.include_router(patient_router)
app.include_router(auth_router)
app.include_router(therapy_sessions_router)
app.include_router(voice_router)
app.include_router(tts_router)
app.include_router(memory_dna_router)
app.include_router(caregiver_router)
app.include_router(adaptive_router)


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