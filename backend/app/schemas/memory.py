from datetime import datetime

from pydantic import BaseModel, ConfigDict


class MemoryCreate(BaseModel):
    patient_id: int
    title: str
    content: str
    category: str | None = None


class MemoryUpdate(BaseModel):
    title: str | None = None
    content: str | None = None
    category: str | None = None


class MemoryResponse(BaseModel):
    id: int
    patient_id: int
    title: str
    content: str
    category: str | None = None
    is_comfort_memory: bool
    created_at: datetime | None = None
    updated_at: datetime | None = None

    model_config = ConfigDict(from_attributes=True)