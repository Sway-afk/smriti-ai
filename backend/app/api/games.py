import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.memory import Memory
from app.models.game_attempt import GameAttempt
from app.models.generated_game import GeneratedGame
from app.models.therapy_session import TherapySession
from app.models.session_game import SessionGame
from app.services.ai_game_generator import generate_ai_game
from app.services.memory_dna import build_memory_dna
from app.schemas.game import (
    GameForPlayer,
    GameAnswerRequest,
)


router = APIRouter(
    prefix="/games",
    tags=["Games"]
)


@router.post("/generate/{memory_id}", response_model=GameForPlayer)
def generate_game(
    memory_id: int,
    difficulty: str = "easy",
    language: str = "English",
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
        "difficulty": difficulty,
        "language": language,
    }

    memory_dna = build_memory_dna(memory_data)

    memory_data["memory_dna"] = memory_dna

    try:
        game = generate_ai_game(memory_data)

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    generated_game = GeneratedGame(
        memory_id=memory.id,
        game_type=game["game_type"],
        question=game["question"],
        options=json.dumps(game["options"]),
        answer=game["answer"],
        difficulty=game["difficulty"],
        language=language
    )

    db.add(generated_game)
    db.commit()
    db.refresh(generated_game)

    return {
        "game_id": generated_game.id,
        "game_type": generated_game.game_type,
        "memory_id": generated_game.memory_id,
        "question": generated_game.question,
        "options": json.loads(generated_game.options),
        "difficulty": generated_game.difficulty
    }


@router.post("/check-answer")
def check_answer(
    request: GameAnswerRequest,
    db: Session = Depends(get_db)
):
    generated_game = (
        db.query(GeneratedGame)
        .filter(GeneratedGame.id == request.game_id)
        .first()
    )

    if generated_game is None:
        raise HTTPException(
            status_code=404,
            detail="Generated game not found"
        )

    correct = (
        request.answer.strip().lower()
        == generated_game.answer.strip().lower()
    )

    score = 1 if correct else 0

    attempt = GameAttempt(
        memory_id=generated_game.memory_id,
        game_type=generated_game.game_type,
        difficulty=generated_game.difficulty,
        user_answer=request.answer,
        correct=correct,
        score=score
    )

    db.add(attempt)

    if request.session_id is not None:

        session = (
            db.query(TherapySession)
            .filter(
                TherapySession.id == request.session_id
            )
            .first()
        )

        if session is None:
            raise HTTPException(
                status_code=404,
                detail="Therapy session not found"
            )

        session_game = (
            db.query(SessionGame)
            .filter(
                SessionGame.session_id == request.session_id,
                SessionGame.game_id == request.game_id
            )
            .first()
        )

        if session_game is None:
            raise HTTPException(
                status_code=404,
                detail="Game not found in this therapy session"
            )

        if not session_game.completed:

            session_game.completed = True
            session.completed_games += 1

            if session.completed_games >= session.total_games:
                session.status = "completed"
                session.completed_at = datetime.now(timezone.utc)

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
        .filter(
            GameAttempt.memory_id == memory_id
        )
        .order_by(
            GameAttempt.created_at.desc()
        )
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
        .join(
            Memory,
            GameAttempt.memory_id == Memory.id
        )
        .filter(
            Memory.patient_id == patient_id
        )
        .order_by(
            GameAttempt.created_at.desc()
        )
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
        .join(
            Memory,
            GameAttempt.memory_id == Memory.id
        )
        .filter(
            Memory.patient_id == patient_id
        )
        .all()
    )

    total_attempts = len(attempts)

    correct_attempts = sum(
        1
        for attempt in attempts
        if attempt.correct
    )

    total_score = sum(
        attempt.score
        for attempt in attempts
    )

    accuracy = (
        (correct_attempts / total_attempts) * 100
        if total_attempts > 0
        else 0
    )

    game_type_stats = {}

    for attempt in attempts:

        game_type = attempt.game_type

        if game_type not in game_type_stats:
            game_type_stats[game_type] = {
                "total_attempts": 0,
                "correct_attempts": 0,
                "accuracy": 0
            }

        game_type_stats[game_type]["total_attempts"] += 1

        if attempt.correct:
            game_type_stats[game_type][
                "correct_attempts"
            ] += 1

    for game_type, stats in game_type_stats.items():

        stats["accuracy"] = round(
            (
                stats["correct_attempts"]
                / stats["total_attempts"]
            ) * 100,
            2
        )

    memory_stats = {}

    for attempt in attempts:

        memory = (
            db.query(Memory)
            .filter(
                Memory.id == attempt.memory_id
            )
            .first()
        )

        if memory is None:
            continue

        memory_id = memory.id

        if memory_id not in memory_stats:
            memory_stats[memory_id] = {
                "memory_title": memory.title,
                "total_attempts": 0,
                "correct_attempts": 0,
                "accuracy": 0
            }

        memory_stats[memory_id][
            "total_attempts"
        ] += 1

        if attempt.correct:
            memory_stats[memory_id][
                "correct_attempts"
            ] += 1

    for memory_id, stats in memory_stats.items():

        stats["accuracy"] = round(
            (
                stats["correct_attempts"]
                / stats["total_attempts"]
            ) * 100,
            2
        )

    difficulty_stats = {}

    for attempt in attempts:

        difficulty = attempt.difficulty

        if difficulty not in difficulty_stats:
            difficulty_stats[difficulty] = {
                "total_attempts": 0,
                "correct_attempts": 0,
                "accuracy": 0
            }

        difficulty_stats[difficulty][
            "total_attempts"
        ] += 1

        if attempt.correct:
            difficulty_stats[difficulty][
                "correct_attempts"
            ] += 1

    for difficulty, stats in difficulty_stats.items():

        stats["accuracy"] = round(
            (
                stats["correct_attempts"]
                / stats["total_attempts"]
            ) * 100,
            2
        )

    return {
        "patient_id": patient_id,
        "total_attempts": total_attempts,
        "correct_attempts": correct_attempts,
        "total_score": total_score,
        "accuracy": round(
            accuracy,
            2
        ),
        "game_type_stats": game_type_stats,
        "memory_stats": memory_stats,
        "difficulty_stats": difficulty_stats
    }


@router.get("/activity/patient/{patient_id}")
def get_patient_recent_activity(
    patient_id: int,
    db: Session = Depends(get_db)
):
    attempts = (
        db.query(GameAttempt)
        .join(
            Memory,
            GameAttempt.memory_id == Memory.id
        )
        .filter(
            Memory.patient_id == patient_id
        )
        .order_by(
            GameAttempt.created_at.desc()
        )
        .limit(10)
        .all()
    )

    return [
        {
            "attempt_id": attempt.id,
            "memory_id": attempt.memory_id,
            "game_type": attempt.game_type,
            "difficulty": attempt.difficulty,
            "correct": attempt.correct,
            "score": attempt.score,
            "created_at": attempt.created_at
        }
        for attempt in attempts
    ]