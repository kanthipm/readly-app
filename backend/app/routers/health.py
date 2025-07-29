from datetime import datetime

from fastapi import APIRouter

from ..models.schemas import HealthResponse, TestResponse
from ..services.ollama_service import ollama_service

router = APIRouter()


@router.get("/test-ollama", response_model=TestResponse)
async def test_ollama():
    """Test endpoint to check Ollama performance"""
    result = ollama_service.test_connection()
    return TestResponse(**result)


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Comprehensive health check endpoint"""
    ollama_available = ollama_service.check_status()

    return HealthResponse(
        status="healthy" if ollama_available else "degraded",
        ollama_available=ollama_available,
        model_loaded=ollama_available,  # Simplified check
        timestamp=datetime.utcnow().isoformat(),
    )
