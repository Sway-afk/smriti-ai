import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.models.generated_game import GeneratedGame
from app.models.memory import Memory
from app.models.patients import Patient
from app.models.session_game import SessionGame
from app.models.therapy_session import TherapySession
from app.models.user import User
from app.services.adaptive_difficulty import get_recommended_difficulty
from app.services.ai_game_generator import generate_ai_game
from app.utils.roles import require_doctor_or_caregiver


router = APIRouter(
    prefix="/therapy-sessions",
    tags=["Therapy Sessions"],
)


@router.post("/start/{patient_id}")
def start_therapy_session(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    session = TherapySession(
        patient_id=patient_id,
        status="active",
        total_games=0,
        completed_games=0,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "patient_id": session.patient_id,
        "status": session.status,
        "total_games": session.total_games,
        "completed_games": session.completed_games,
        "started_at": session.started_at,
    }


@router.post("/daily/{patient_id}")
def create_daily_therapy_session(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    patient = (
        db.query(Patient)
        .filter(Patient.id == patient_id)
        .first()
    )

    if patient is None:
        raise HTTPException(
            status_code=404,
            detail="Patient not found",
        )

    patient_language = patient.language or "English"

    recommended_difficulty = get_recommended_difficulty(
        patient_id=patient_id,
        db=db,
    )

    memories = (
        db.query(Memory)
        .filter(Memory.patient_id == patient_id)
        .order_by(Memory.created_at.desc())
        .all()
    )

    if not memories:
        raise HTTPException(
            status_code=404,
            detail="No memories found for this patient",
        )

    session = TherapySession(
        patient_id=patient_id,
        status="active",
        total_games=0,
        completed_games=0,
    )

    db.add(session)
    db.flush()

    created_games = []

    # Five different cognitive abilities in one daily session.
    # Each game is still personalized from the patient's memories.
    game_plan = [
        ("multiple_choice", 0),
        ("attention", 1),
        ("routine_recall", 2),
        ("pattern_recognition", 3),
        ("emotional_engagement", 4),
    ]

    # Prefer five different recent memories instead of cycling through only
    # the first three. Duplicate title/content memories are ignored.
    usable_memories = []
    seen_memory_keys = set()

    for candidate in memories:
        memory_key = (
            f"{candidate.title or ''}"
            f"::{candidate.content or ''}"
        ).strip().lower()

        if memory_key in seen_memory_keys:
            continue

        seen_memory_keys.add(memory_key)
        usable_memories.append(candidate)

        if len(usable_memories) >= 5:
            break

    if not usable_memories:
        usable_memories = memories[:5]

    used_memory_ids = set()
    used_answers = set()

    for game_number, (game_type, memory_index) in enumerate(game_plan):
        preferred_memory = usable_memories[
            memory_index % len(usable_memories)
        ]

        # When at least five distinct memories exist, use a different memory
        # for each question. When fewer exist, rotate through them.
        candidate_memories = [preferred_memory]
        candidate_memories.extend(
            memory
            for memory in usable_memories
            if memory.id != preferred_memory.id
        )

        if len(usable_memories) >= 5:
            unused_memories = [
                memory
                for memory in candidate_memories
                if memory.id not in used_memory_ids
            ]

            if unused_memories:
                candidate_memories = unused_memories

        game = None
        memory = None

        # Try to avoid repeating the exact same correct answer within the
        # five-question session by trying other memories first.
        for candidate_memory in candidate_memories:
            memory_data = {
                "id": candidate_memory.id,
                "title": candidate_memory.title,
                "content": candidate_memory.content,
                "difficulty": recommended_difficulty,
                "language": patient_language,
                "game_type": game_type,
            }

            try:
                candidate_game = generate_ai_game(memory_data)
            except ValueError as error:
                print(
                    f"Game generation failed: "
                    f"type={game_type}, "
                    f"memory_id={candidate_memory.id}, "
                    f"error={error}"
                )
                continue

            answer_key = str(
                candidate_game.get("answer", "")
            ).strip().casefold()

            if answer_key and answer_key in used_answers:
                continue

            game = candidate_game
            memory = candidate_memory
            break

        # If every candidate repeats an answer, keep a valid generated game
        # rather than failing the whole five-question session.
        if game is None:
            for candidate_memory in candidate_memories:
                memory_data = {
                    "id": candidate_memory.id,
                    "title": candidate_memory.title,
                    "content": candidate_memory.content,
                    "difficulty": recommended_difficulty,
                    "language": patient_language,
                    "game_type": game_type,
                }

                try:
                    game = generate_ai_game(memory_data)
                    memory = candidate_memory
                    break
                except ValueError:
                    continue

        if game is None or memory is None:
            continue

        used_memory_ids.add(memory.id)

        answer_key = str(
            game.get("answer", "")
        ).strip().casefold()

        if answer_key:
            used_answers.add(answer_key)

        generated_game = GeneratedGame(
            memory_id=memory.id,
            game_type=game["game_type"],
            question=game["question"],
            options=json.dumps(game["options"]),
            answer=game["answer"],
            difficulty=game["difficulty"],
            language=patient_language,
        )

        db.add(generated_game)
        db.flush()

        session_game = SessionGame(
            session_id=session.id,
            game_id=generated_game.id,
            completed=False,
        )

        db.add(session_game)

        session.total_games += 1

        created_games.append(
            {
                "question_number": session.total_games,
                "game_id": generated_game.id,
                "memory_id": memory.id,
                "memory_title": memory.title,
                "memory_image_url": memory.image_url,
                "game_type": generated_game.game_type,
                "question": generated_game.question,
                "options": game["options"],
                "difficulty": generated_game.difficulty,
                "language": patient_language,
            }
        )

    # A daily therapy session must contain all five questions.
    if session.total_games != 5:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                "Could not generate the complete 5-question "
                "cognitive therapy session from the patient's memories"
            ),
        )

    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "patient_id": session.patient_id,
        "status": session.status,
        "difficulty": recommended_difficulty,
        "total_games": session.total_games,
        "completed_games": session.completed_games,
        "question_count": len(created_games),
        "language": patient_language,
        "games": created_games,
        "started_at": session.started_at,
    }


@router.get("/patient/{patient_id}")
def get_patient_therapy_sessions(
    patient_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    sessions = (
        db.query(TherapySession)
        .filter(TherapySession.patient_id == patient_id)
        .order_by(TherapySession.started_at.desc())
        .all()
    )

    return [
        {
            "session_id": session.id,
            "patient_id": session.patient_id,
            "status": session.status,
            "total_games": session.total_games,
            "completed_games": session.completed_games,
            "progress_percent": (
                round(
                    (
                        session.completed_games
                        / session.total_games
                    ) * 100,
                    2,
                )
                if session.total_games > 0
                else 0
            ),
            "started_at": session.started_at,
            "completed_at": session.completed_at,
        }
        for session in sessions
    ]


@router.post("/{session_id}/games/{game_id}")
def add_game_to_session(
    session_id: int,
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    session = (
        db.query(TherapySession)
        .filter(TherapySession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Therapy session not found",
        )

    existing_game = (
        db.query(SessionGame)
        .filter(
            SessionGame.session_id == session_id,
            SessionGame.game_id == game_id,
        )
        .first()
    )

    if existing_game is not None:
        return {
            "session_id": session_id,
            "game_id": game_id,
            "completed": existing_game.completed,
            "total_games": session.total_games,
            "message": "Game is already attached to this session",
        }

    generated_game = (
        db.query(GeneratedGame)
        .filter(GeneratedGame.id == game_id)
        .first()
    )

    if generated_game is None:
        raise HTTPException(
            status_code=404,
            detail="Generated game not found",
        )

    session_game = SessionGame(
        session_id=session_id,
        game_id=game_id,
        completed=False,
    )

    db.add(session_game)
    session.total_games += 1

    db.commit()
    db.refresh(session_game)

    return {
        "session_id": session_id,
        "game_id": game_id,
        "completed": False,
        "total_games": session.total_games,
    }


@router.get("/{session_id}")
def get_therapy_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    session = (
        db.query(TherapySession)
        .filter(TherapySession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Therapy session not found",
        )

    return {
        "session_id": session.id,
        "patient_id": session.patient_id,
        "status": session.status,
        "total_games": session.total_games,
        "completed_games": session.completed_games,
        "started_at": session.started_at,
        "completed_at": session.completed_at,
    }


@router.post("/{session_id}/games/{game_id}/complete")
def complete_session_game(
    session_id: int,
    game_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    session = (
        db.query(TherapySession)
        .filter(TherapySession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Therapy session not found",
        )

    session_game = (
        db.query(SessionGame)
        .filter(
            SessionGame.session_id == session_id,
            SessionGame.game_id == game_id,
        )
        .first()
    )

    if session_game is None:
        raise HTTPException(
            status_code=404,
            detail="Game not found in session",
        )

    if not session_game.completed:
        session_game.completed = True
        session.completed_games += 1

        if session.completed_games >= session.total_games:
            session.status = "completed"
            session.completed_at = datetime.now(
                timezone.utc
            )

        db.commit()

    return {
        "session_id": session_id,
        "game_id": game_id,
        "completed": session_game.completed,
        "completed_games": session.completed_games,
        "total_games": session.total_games,
        "status": session.status,
    }


@router.get("/{session_id}/games")
def get_session_games(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    session = (
        db.query(TherapySession)
        .filter(TherapySession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Therapy session not found",
        )

    session_games = (
        db.query(SessionGame)
        .filter(SessionGame.session_id == session_id)
        .all()
    )

    games = []

    for session_game in session_games:
        game = (
            db.query(GeneratedGame)
            .filter(GeneratedGame.id == session_game.game_id)
            .first()
        )

        if game is None:
            continue

        memory = (
            db.query(Memory)
            .filter(Memory.id == game.memory_id)
            .first()
        )

        games.append(
            {
                "game_id": game.id,
                "memory_id": game.memory_id,
                "memory_title": memory.title if memory else None,
                "memory_image_url": (
                    memory.image_url if memory else None
                ),
                "game_type": game.game_type,
                "question": game.question,
                "options": json.loads(game.options),
                "difficulty": game.difficulty,
                "completed": session_game.completed,
            }
        )

    return games


@router.get("/{session_id}/progress")
def get_session_progress(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_doctor_or_caregiver),
):
    session = (
        db.query(TherapySession)
        .filter(TherapySession.id == session_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Therapy session not found",
        )

    progress = (
        (session.completed_games / session.total_games) * 100
        if session.total_games > 0
        else 0
    )

    return {
        "session_id": session.id,
        "status": session.status,
        "completed_games": session.completed_games,
        "total_games": session.total_games,
        "progress_percent": round(progress, 2),
        "started_at": session.started_at,
        "completed_at": session.completed_at,
    }