from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    DateTime,
    Boolean,
)

from sqlalchemy.sql import func

from app.database.database import Base


class Memory(Base):
    __tablename__ = "memories"

    id = Column(Integer, primary_key=True, index=True)

    patient_id = Column(Integer, nullable=False, index=True)

    title = Column(String, nullable=False)

    content = Column(Text, nullable=False)

    category = Column(String, nullable=True)

    # New field
    is_comfort_memory = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="false",
    )

    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )