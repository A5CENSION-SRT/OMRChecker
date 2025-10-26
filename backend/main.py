"""
FastAPI Main Application for OMR Grading System MVP
"""
import sys
import logging
from pathlib import Path

# Configure logging FIRST before any other imports
# This ensures OMRChecker library uses our logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    force=True  # Override any existing configuration
)

# Add project root to Python path for OMRChecker imports
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from backend.config import settings, RESULTS_DIR
from backend.routes.omr import router as omr_router

# Create FastAPI app
app = FastAPI(
    title=settings.app_name,
    description="Mass OMR sheet grading with single template",
    version="1.0.0",
    debug=settings.debug
)

# CORS middleware for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve static files (marked images, CSVs)
app.mount("/files", StaticFiles(directory=str(RESULTS_DIR)), name="files")

# Include routes
app.include_router(omr_router, prefix="/api/omr", tags=["OMR Processing"])


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "OMR Grading System API",
        "version": "1.0.0",
        "endpoints": {
            "upload": "POST /api/omr/upload",
            "status": "GET /api/omr/status/{batchId}",
            "results": "GET /api/omr/results/{batchId}",
            "download": "GET /api/omr/download/{batchId}",
            "dashboard": "GET /api/omr/dashboard"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "omr-grading-api"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "backend.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
