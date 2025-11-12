from typing import List
import os

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 5000
    DEBUG: bool = True

    # CORS settings
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        # Vercel deployment URLs - will be set via environment variable
    ]
    
    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        # Override ALLOWED_ORIGINS from environment variable if provided
        env_origins = os.getenv("ALLOWED_ORIGINS")
        if env_origins:
            # Split comma-separated values and strip whitespace
            self.ALLOWED_ORIGINS = [origin.strip() for origin in env_origins.split(",")]

    # Ollama settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral"
    OLLAMA_TIMEOUT: int = 60

    # Processing settings
    MAX_CHUNKS: int = 3
    MAX_TOKENS_PER_CHUNK: int = 1500
    MAX_RETRIES: int = 3

    # Gemini API settings (optional)
    GEMINI_API_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "allow"  # Allow extra fields from environment


settings = Settings()
