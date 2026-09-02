from pydantic import BaseModel
from typing import Optional


class PatientCreate(BaseModel):
    full_name: str
    age: int
    language: str
    caregiver_name: str


class PatientResponse(BaseModel):
    id: int
    full_name: str
    age: int
    language: str
    caregiver_name: str

    class Config:
        from_attributes = True