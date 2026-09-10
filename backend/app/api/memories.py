from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.memory import Memory
from app.models.user import User
from app.schemas.memory import MemoryCreate, MemoryUpdate, MemoryResponse
from app.services.memory_graph import build_patient_memory_graph
from app.utils.roles import require_doctor_or_caregiver


router = APIRouter(
    prefix="/memories",
    tags=["Memories"]
)


BASE_DIR = Path(__file__).resolve().parents[2]
UPLOAD_DIR = BASE_DIR / "uploads" / "memories"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_IMAGE_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}

MAX_IMAGE_SIZE = 10 * 1024 * 1024


@router.post("/", response_model=MemoryResponse)
def create_memory(
    memory: MemoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    new_memory = Memory(
        patient_id=memory.patient_id,
        title=memory.title,
        content=memory.content,
        category=memory.category,
        image_url=memory.image_url,
    )

    if memory.sequence_steps:
        new_memory.sequence_steps = memory.sequence_steps

    db.add(new_memory)
    db.commit()
    db.refresh(new_memory)

    return new_memory


@router.get("/", response_model=list[MemoryResponse])
def get_memories(
    patient_id: int,
    category: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    query = db.query(Memory).filter(Memory.patient_id == patient_id)

    if category is not None:
        query = query.filter(Memory.category == category)

    if search is not None:
        search_pattern = f"%{search}%"
        query = query.filter(
            (Memory.title.ilike(search_pattern))
            | (Memory.content.ilike(search_pattern))
        )

    return query.offset(skip).limit(limit).all()


@router.get("/graph/{patient_id}")
def get_memory_graph(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    memories = (
        db.query(Memory)
        .filter(Memory.patient_id == patient_id)
        .all()
    )

    memory_data = [
        {
            "id": memory.id,
            "title": memory.title,
            "content": memory.content,
            "category": memory.category,
            "image_url": memory.image_url,
        }
        for memory in memories
    ]

    return build_patient_memory_graph(memory_data)


@router.get("/{memory_id}", response_model=MemoryResponse)
def get_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
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


@router.put("/{memory_id}", response_model=MemoryResponse)
def update_memory(
    memory_id: int,
    memory_update: MemoryUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
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

    if memory_update.title is not None:
        memory.title = memory_update.title

    if memory_update.content is not None:
        memory.content = memory_update.content

    if memory_update.category is not None:
        memory.category = memory_update.category

    if memory_update.image_url is not None:
        memory.image_url = memory_update.image_url

    if memory_update.sequence_steps is not None:
        memory.sequence_steps = memory_update.sequence_steps

    db.commit()
    db.refresh(memory)

    return memory

@router.patch("/{memory_id}/comfort", response_model=MemoryResponse)
def set_comfort_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
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

    # Remove comfort flag from all memories for this patient
    (
        db.query(Memory)
        .filter(Memory.patient_id == memory.patient_id)
        .update({"is_comfort_memory": False})
    )

    # Mark this memory as the comfort memory
    memory.is_comfort_memory = True

    db.commit()
    db.refresh(memory)

    return memory


@router.get("/comfort/{patient_id}", response_model=MemoryResponse)
def get_comfort_memory(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    memory = (
        db.query(Memory)
        .filter(
            Memory.patient_id == patient_id,
            Memory.is_comfort_memory == True,
        )
        .first()
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="No comfort memory found for this patient"
        )

    return memory


@router.post("/{memory_id}/image", response_model=MemoryResponse)
async def upload_memory_image(
    memory_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
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

    if file.content_type not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG, and WEBP images are supported"
        )

    file_data = await file.read()

    if not file_data:
        raise HTTPException(
            status_code=400,
            detail="Uploaded image is empty"
        )

    if len(file_data) > MAX_IMAGE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image must be 10 MB or smaller"
        )

    extension = ALLOWED_IMAGE_TYPES[file.content_type]
    filename = f"{uuid4().hex}{extension}"
    destination = UPLOAD_DIR / filename

    destination.write_bytes(file_data)

    if memory.image_url:
        old_filename = Path(memory.image_url).name
        old_file = UPLOAD_DIR / old_filename

        if old_file.exists():
            old_file.unlink()

    memory.image_url = f"/uploads/memories/{filename}"

    db.commit()
    db.refresh(memory)

    return memory


@router.delete("/{memory_id}", response_model=dict)
def delete_memory(
    memory_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
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

    if memory.image_url:
        filename = Path(memory.image_url).name
        image_file = UPLOAD_DIR / filename

        if image_file.exists():
            image_file.unlink()

    db.delete(memory)
    db.commit()

    return {
        "message": "Memory deleted successfully"
    }
