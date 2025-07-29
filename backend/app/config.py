from typing import List

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server settings
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    DEBUG: bool = True

    # CORS settings
    ALLOWED_ORIGINS: List[str] = ["*"]

    # Ollama settings
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "mistral"
    OLLAMA_TIMEOUT: int = 60

    # Processing settings
    MAX_CHUNKS: int = 3
    MAX_TOKENS_PER_CHUNK: int = 1500
    MAX_RETRIES: int = 3

    class Config:
        env_file = ".env"


settings = Settings()
