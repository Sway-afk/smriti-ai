from sqlalchemy import Column, Integer, String
from app.database.database import Base


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    age = Column(Integer)
    language = Column(String)
    caregiver_name = Column(String)