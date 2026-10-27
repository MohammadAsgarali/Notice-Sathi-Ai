import os
from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

# Base directory of the backend
BASE_DIR = Path(__file__).resolve().parent

class Settings(BaseSettings):
    APP_NAME: str = "NoticeSaathi AI"
    APP_ENV: str = "development"
    DEBUG: bool = True
    PORT: int = 8000
    HOST: str = "127.0.0.1"
    FRONTEND_ORIGIN: str = "http://localhost:5173"
    
    # SQLite default database path
    DATABASE_URL: str = f"sqlite:///{BASE_DIR / 'noticesaathi.db'}"
    
    # File uploads
    MAX_UPLOAD_MB: int = 15
    UPLOAD_DIR: str = str(BASE_DIR / "uploads")
    
    # OCR Settings
    TESSERACT_CMD: Optional[str] = None
    TESSERACT_LANGUAGES: str = "eng+hin"
    
    # Gemma 4 & AI Configuration
    # Supported: "mock", "ollama", "huggingface", "openai-compatible", "gemini"
    AI_PROVIDER: str = "mock"
    GEMMA_MODEL: str = "google/gemma-4-it"
    GEMMA_API_BASE: str = "http://localhost:11434/v1"
    GEMMA_API_KEY: Optional[str] = None
    GEMINI_API_KEY: Optional[str] = None
    HF_API_KEY: Optional[str] = None
    
    # Explicit Mock Mode override
    MOCK_AI_MODE: bool = False
    
    class Config:
        env_file = str(BASE_DIR / ".env")
        env_file_encoding = "utf-8"
        extra = "ignore"

settings = Settings()

# Ensure uploads directory exists
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
