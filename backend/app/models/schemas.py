from typing import List, Optional

from pydantic import BaseModel


class QuizQuestion(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str


class Subtopic(BaseModel):
    title: str
    description: str
    key_concepts: List[str]
    status: str
    quiz: List[QuizQuestion]


class KnowledgeMap(BaseModel):
    topic: str
    subtopics: List[Subtopic]


class QuestionGenerationRequest(BaseModel):
    title: str
    description: str
    key_concepts: List[str]
    num_questions: Optional[int] = 3


class QuestionResponse(BaseModel):
    questions: List[QuizQuestion]


class UploadResponse(BaseModel):
    maps: List[str]
    message: str
    chunks_processed: int


class TestResponse(BaseModel):
    status: str
    response_time: str
    response: Optional[str] = None
    error: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    ollama_available: bool
    model_loaded: bool
    timestamp: str
