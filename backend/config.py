"""
Configuration for OMR Grading System MVP
All paths and settings are hardcoded for simplicity
"""
from pathlib import Path
from pydantic_settings import BaseSettings

# Base paths
BASE_DIR = Path(__file__).parent
STORAGE_DIR = BASE_DIR / "storage"
UPLOADS_DIR = STORAGE_DIR / "uploads"
RESULTS_DIR = STORAGE_DIR / "results"
TEMPLATE_DIR = STORAGE_DIR / "template"
BATCHES_DIR = STORAGE_DIR / "batches"

# OMRChecker paths (relative to project root)
PROJECT_ROOT = BASE_DIR.parent
OMRCHECKER_SRC = PROJECT_ROOT / "src"
OMRCHECKER_DEFAULTS = OMRCHECKER_SRC / "defaults"

# Hardcoded template files
TEMPLATE_JSON = TEMPLATE_DIR / "template.json"
ANSWER_KEY_JSON = TEMPLATE_DIR / "evaluation.json"
CONFIG_JSON = TEMPLATE_DIR / "config.json"
MARKER_IMAGE = TEMPLATE_DIR / "omr_marker.jpg"

# Results CSV filename pattern
RESULTS_CSV_NAME = "Results_Master.csv"
RESULTS_CSV_PATH = RESULTS_DIR / RESULTS_CSV_NAME

# File upload constraints
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# Processing settings
MAX_CONCURRENT_JOBS = 4  # Number of parallel processing workers


class Settings(BaseSettings):
    """Application settings"""
    app_name: str = "OMR Grading System MVP"
    debug: bool = True
    cors_origins: list = ["http://localhost:3000", "http://localhost:3001"]
    
    class Config:
        env_file = ".env"


settings = Settings()
