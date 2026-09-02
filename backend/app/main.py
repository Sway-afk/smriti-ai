from fastapi import FastAPI

from app.database.database import engine, Base
from app.models.memory import Memory
from app.models.game_attempt import GameAttempt
from app.api.memories import router as memories_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smriti AI Backend",
    version="1.0.0"
)
app.include_router(memories_router)
from app.api.games import router as games_router

app.include_router(games_router)

@app.get("/")
def root():
    return {"message": "Welcome to Smriti AI Backend"}


@app.get("/health")
def health():
    return {"status": "healthy"}