from fastapi import FastAPI

from app.database.database import engine
from app.database.base import Base

from app.api.memories import router as memories_router
from app.api.games import router as games_router
from app.api.patients import router as patient_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smriti AI Backend",
    version="1.0.0"
)

app.include_router(memories_router)
app.include_router(games_router)
app.include_router(patient_router)


@app.get("/")
def root():
    return {"message": "Welcome to Smriti AI Backend 🚀"}


@app.get("/health")
def health():
    return {"status": "healthy"}