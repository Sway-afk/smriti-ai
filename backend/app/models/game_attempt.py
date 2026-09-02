from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.sql import func

from app.database.database import Base


class GameAttempt(Base):
    __tablename__ = "game_attempts"

    id = Column(Integer, primary_key=True, index=True)

    memory_id = Column(Integer, nullable=False, index=True)

    game_type = Column(String, nullable=False)

    difficulty = Column(String, nullable=False)

    user_answer = Column(String, nullable=False)

    correct = Column(Boolean, nullable=False)

    score = Column(Integer, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )