from fastapi import FastAPI

from app.database.database import engine
from app.database.base import Base

from app.models.patients import Patient
from app.api.patients import router as patient_router

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Smriti AI Backend",
    version="1.0.0"
)

app.include_router(patient_router)


@app.get("/")
def root():
    return {
        "message": "Welcome to Smriti AI Backend 🚀"
    }