from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MemoryCreate(BaseModel):
    patient_id: int
    title: str
    content: str
    category: str | None = None


class MemoryResponse(BaseModel):
    id: int
    patient_id: int
    title: str
    content: str
    category: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)