from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.memory import Memory
from app.models.game_attempt import GameAttempt
from app.services.game_generator import generate_game_from_memory
from app.schemas.game import GameResponse, GameAnswer, GameForPlayer, GameAnswerRequest


router = APIRouter(
    prefix="/games",
    tags=["Games"]
)


@router.post("/generate/{memory_id}", response_model=GameForPlayer)
def generate_game(
    memory_id: int,
    difficulty: str = "easy",
    db: Session = Depends(get_db)
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

    memory_data = {
        "id": memory.id,
        "title": memory.title,
        "content": memory.content,
        "difficulty": difficulty
    }

    game = generate_game_from_memory(memory_data)

    game.pop("answer", None)

    return game

@router.post("/check-answer")
def check_answer(
    request: GameAnswerRequest,
    db: Session = Depends(get_db)
):
    memory = (
        db.query(Memory)
        .filter(Memory.id == request.memory_id)
        .first()
    )

    if memory is None:
        raise HTTPException(
            status_code=404,
            detail="Memory not found"
        )

    memory_data = {
        "id": memory.id,
        "title": memory.title,
        "content": memory.content,
        "difficulty": "easy"
    }

    game = generate_game_from_memory(memory_data)

    correct = (
        request.answer.strip().lower()
        == game["answer"].strip().lower()
    )

    score = 1 if correct else 0

    attempt = GameAttempt(
        memory_id=memory.id,
        game_type=game["game_type"],
        difficulty=game["difficulty"],
        user_answer=request.answer,
        correct=correct,
        score=score
    )

    db.add(attempt)
    db.commit()
    db.refresh(attempt)

    return {
        "correct": correct,
        "score": score,
        "attempt_id": attempt.id
    }

@router.get("/history/{memory_id}")
def get_game_history(
    memory_id: int,
    db: Session = Depends(get_db)
):
    attempts = (
        db.query(GameAttempt)
        .filter(GameAttempt.memory_id == memory_id)
        .order_by(GameAttempt.created_at.desc())
        .all()
    )

    return attempts

@router.get("/history/patient/{patient_id}")
def get_patient_game_history(
    patient_id: int,
    db: Session = Depends(get_db)
):
    attempts = (
        db.query(GameAttempt)
        .join(Memory, GameAttempt.memory_id == Memory.id)
        .filter(Memory.patient_id == patient_id)
        .order_by(GameAttempt.created_at.desc())
        .all()
    )

    return attempts

@router.get("/analytics/patient/{patient_id}")
def get_patient_game_analytics(
    patient_id: int,
    db: Session = Depends(get_db)
):
    attempts = (
        db.query(GameAttempt)
        .join(Memory, GameAttempt.memory_id == Memory.id)
        .filter(Memory.patient_id == patient_id)
        .all()
    )

    total_attempts = len(attempts)
    correct_attempts = sum(1 for attempt in attempts if attempt.correct)
    total_score = sum(attempt.score for attempt in attempts)

    accuracy = (
        (correct_attempts / total_attempts) * 100
        if total_attempts > 0
        else 0
    )

    return {
        "patient_id": patient_id,
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "total_score": total_score,
        "accuracy": round(accuracy, 2)
    }