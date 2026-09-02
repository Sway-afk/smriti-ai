from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.schemas.patient import PatientCreate, PatientResponse
from app.services.patient_service import (
    create_patient,
    get_all_patients,
    get_patient,
    delete_patient,
)

router = APIRouter(prefix="/patients", tags=["Patients"])


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("/", response_model=PatientResponse)
def create_new_patient(patient: PatientCreate, db: Session = Depends(get_db)):
    return create_patient(db, patient)


@router.get("/", response_model=list[PatientResponse])
def read_patients(db: Session = Depends(get_db)):
    return get_all_patients(db)


@router.get("/{patient_id}", response_model=PatientResponse)
def read_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = get_patient(db, patient_id)

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return patient


@router.delete("/{patient_id}")
def remove_patient(patient_id: int, db: Session = Depends(get_db)):
    patient = delete_patient(db, patient_id)

    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")

    return {"message": "Patient deleted successfully"}