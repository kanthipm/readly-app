import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .app.config import settings
from .app.routers import health, questions, upload
from .app.services.ollama_service import check_ollama_status, preload_model

app = FastAPI(
    title="Readly  API",
    version="1.0.0",
    description="AI-powered knowledge map generation from PDF documents",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api/v1", tags=["upload"])
app.include_router(questions.router, prefix="/api/v1", tags=["questions"])
app.include_router(health.router, prefix="/api/v1", tags=["health"])


@app.get("/")
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Readly API",
        "version": "1.0.0",
        "docs_url": "/docs",
        "endpoints": {
            "upload": "POST /api/v1/upload - Upload PDF file",
            "generate-questions": "POST /api/v1/generate-questions - Generate additional questions",
            "test-ollama": "GET /api/v1/test-ollama - Test Ollama connection",
        },
    }


@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    print("Starting FastAPI server...")
    print("Checking Ollama status...")

    if not check_ollama_status():
        print("Warning: Ollama is not accessible")
        print("Make sure Ollama is running: ollama serve")
        print("And Mistral model is installed: ollama pull mistral")

    print("Preloading model...")
    if preload_model():
        print("Server ready!")
    else:
        print("Failed to preload model - please check Ollama")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
