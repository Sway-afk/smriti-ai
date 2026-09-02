from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.memory import Memory
from app.schemas.memory import MemoryCreate, MemoryResponse


router = APIRouter(
    prefix="/memories",
    tags=["Memories"]
)


@router.post("/", response_model=MemoryResponse)
def create_memory(memory: MemoryCreate, db: Session = Depends(get_db)):
    new_memory = Memory(
        patient_id=memory.patient_id,
        title=memory.title,
        content=memory.content,
        category=memory.category
    )

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return new_memory


@router.get("/", response_model=list[MemoryResponse])
def get_memories(patient_id: int, db: Session = Depends(get_db)):
    memories = (
        db.query(Memory)
        .filter(Memory.patient_id == patient_id)
        .all()
    )

    return memories


@router.get("/{memory_id}", response_model=MemoryResponse)
def get_memory(memory_id: int, db: Session = Depends(get_db)):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    return memory


@router.delete("/{memory_id}")
def delete_memory(memory_id: int, db: Session = Depends(get_db)):
    memory = (
        db.query(Memory)
        .filter(Memory.id == memory_id)
        .first()
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    db.delete(memory)
    db.commit()

    return {"message": "Memory deleted successfully"}