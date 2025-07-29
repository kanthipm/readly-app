import json
import time

from fastapi import APIRouter, HTTPException

from ..models.schemas import QuestionGenerationRequest, QuestionResponse
from ..services.knowledge_service import knowledge_service
from ..utils.validators import validate_questions

router = APIRouter()


@router.post("/generate-questions", response_model=QuestionResponse)
async def generate_additional_questions(request: QuestionGenerationRequest):
    """Generate additional quiz questions for a specific subtopic"""
    start_time = time.time()

    print(f"Generating {request.num_questions} questions for: {request.title}")

    questions_json = knowledge_service.generate_additional_questions(
        request.title, request.description, request.key_concepts, request.num_questions
    )

    generation_time = time.time() - start_time
    print(f"Question generation took {generation_time:.2f} seconds")

    if validate_questions(questions_json):
        try:
            questions = json.loads(questions_json)
            return QuestionResponse(questions=questions)
        except json.JSONDecodeError:
            raise HTTPException(
                status_code=500, detail="Invalid JSON response from AI model"
            )
    else:
        print("Generated questions are invalid (missing explanations or malformed)")
        raise HTTPException(status_code=500, detail="Generated questions are invalid")
