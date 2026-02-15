import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .app.config import settings
from .app.routers import health, questions, upload, text_processing
from .app.services.gemini_service import gemini_service

app = FastAPI(
    title="Readly API",
    version="1.0.0",
    description="AI-powered knowledge map generation from PDF documents",
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(upload.router, prefix="/api/v1", tags=["upload"])
app.include_router(text_processing.router, prefix="/api/v1", tags=["text-processing"])
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
            "process-text": "POST /api/v1/process-text - Process text content",
            "generate-questions": "POST /api/v1/generate-questions - Generate additional questions",
            "test-gemini": "GET /api/v1/test-gemini - Test Gemini API connection",
        },
    }


@app.on_event("startup")
async def startup_event():
    """Initialize the application on startup"""
    print("Starting FastAPI server...")
    print("Checking Gemini API status...")

    if gemini_service.check_api_status():
        print("Gemini API is accessible")
        print("Server ready!")
    else:
        print("WARNING: Gemini API not accessible")
        print("Set GEMINI_API_KEY environment variable for AI features")
        print("Using mock responses for now")


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level="info",
    )
