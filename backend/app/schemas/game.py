from pydantic import BaseModel


class GameResponse(BaseModel):
    game_type: str
    memory_id: int | None = None
    question: str
    options: list[str]
    answer: str
    difficulty: str

class GameAnswer(BaseModel):
    answer: str

class GameForPlayer(BaseModel):
    game_type: str
    memory_id: int | None = None
    question: str
    options: list[str]
    difficulty: str

class GameAnswerRequest(BaseModel):
    memory_id: int
    answer: str