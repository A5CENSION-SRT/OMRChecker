"""
OMR Processing API Routes
Handles batch upload, processing status, and results retrieval
"""

import asyncio
import logging
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, BackgroundTasks, File, HTTPException, UploadFile
from fastapi.responses import FileResponse

from backend.config import (
    ALLOWED_EXTENSIONS,
    BATCHES_DIR,
    MAX_FILE_SIZE,
    RESULTS_DIR,
    UPLOADS_DIR,
)
from backend.utils.csv_helper import (
    get_batch_csv_export,
    get_batch_results,
    get_dashboard_stats,
    initialize_results_csv,
)
from backend.workers.processor import (
    batch_status,
    get_batch_status,
    initialize_worker,
    process_batch_worker,
    queue_batch_processing,
)

# Get logger (configured in main.py)
logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize CSV and worker on startup
logger.info("🔧 Initializing OMR API routes...")
initialize_results_csv()
initialize_worker()
logger.info("✅ OMR API routes initialized")


# Start background worker
@router.on_event("startup")
async def startup_event():
    """Start background processing worker"""
    logger.info("🚀 Starting background processing worker...")
    asyncio.create_task(process_batch_worker())
    logger.info("✅ Background worker task created")


def validate_image_file(file: UploadFile) -> bool:
    """Validate uploaded image file"""
    # Check extension
    ext = Path(file.filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False

    # Check content type
    if not file.content_type or not file.content_type.startswith("image/"):
        return False

    return True


@router.post("/upload")
async def upload_batch(
    files: List[UploadFile] = File(...), background_tasks: BackgroundTasks = None
):
    """
    Upload a batch of OMR images for processing

    Args:
        files: List of image files

    Returns:
        Batch information with status URL
    """
    logger.info(f"📤 Upload request received with {len(files)} files")

    if not files:
        logger.warning("⚠️  No files provided in upload request")
        raise HTTPException(status_code=400, detail="No files provided")

    # Validate all files
    for file in files:
        logger.info(f"   Validating file: {file.filename}")
        if not validate_image_file(file):
            logger.error(f"❌ Invalid file: {file.filename}")
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file: {file.filename}. Only JPG/PNG images allowed.",
            )

    logger.info(f"✅ All {len(files)} files validated successfully")

    # Create unique batch ID
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    batch_id = f"batch_{timestamp}"

    logger.info(f"🆔 Created batch ID: {batch_id}")

    # Create batch directory
    batch_dir = UPLOADS_DIR / batch_id
    batch_dir.mkdir(parents=True, exist_ok=True)
    logger.info(f"📁 Created batch directory: {batch_dir}")

    # Save uploaded files
    saved_files = []
    for file in files:
        file_path = batch_dir / file.filename

        logger.info(f"💾 Saving file: {file.filename}")

        # Save file
        with open(file_path, "wb") as buffer:
            content = await file.read()

            # Check file size
            if len(content) > MAX_FILE_SIZE:
                logger.error(
                    f"❌ File too large: {file.filename} ({len(content)} bytes)"
                )
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} exceeds maximum size of 50MB",
                )

            buffer.write(content)
            logger.info(f"✅ File saved: {file.filename} ({len(content)} bytes)")

        saved_files.append(str(file_path))

    logger.info(f"📦 All {len(saved_files)} files saved to: {batch_dir}")

    # Queue for processing
    logger.info(f"📥 Queuing batch {batch_id} for processing...")
    batch_status = await queue_batch_processing(batch_id, saved_files)
    logger.info(f"✅ Batch {batch_id} queued successfully")

    response = {
        "batchId": batch_id,
        "status": "queued",
        "totalFiles": len(saved_files),
        "queuedAt": batch_status["queuedAt"],
        "statusUrl": f"/api/omr/status/{batch_id}",
        "message": f"Batch queued with {len(saved_files)} files",
    }

    logger.info(f"📨 Returning upload response: {response}")
    return response


@router.get("/status/{batch_id}")
async def get_status(batch_id: str):
    """
    Get processing status for a batch

    Args:
        batch_id: Batch identifier

    Returns:
        Current status with progress information
    """
    status = get_batch_status(batch_id)

    if not status:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Calculate estimated time remaining (rough estimate: 1.5 seconds per image)
    remaining_files = status.get("pending", 0) + status.get("processing", 0)
    estimated_time = remaining_files * 1.5

    return {
        "batchId": batch_id,
        "status": status["status"],
        "totalFiles": status["totalFiles"],
        "processed": status["processed"],
        "processing": status.get("processing", 0),
        "pending": status.get("pending", 0),
        "failed": status["failed"],
        "progress": status.get("progress", 0),
        "estimatedTimeRemaining": int(estimated_time),
        "queuedAt": status.get("queuedAt"),
        "startedAt": status.get("startedAt"),
        "completedAt": status.get("completedAt"),
        "files": status.get("files", []),
    }


@router.get("/results/{batch_id}")
async def get_results(batch_id: str):
    """
    Get final results for a completed batch

    Args:
        batch_id: Batch identifier

    Returns:
        Complete results with scores and statistics
    """
    # Check if batch exists
    status = get_batch_status(batch_id)
    if not status:
        raise HTTPException(status_code=404, detail="Batch not found")

    # Get results from CSV
    results = get_batch_results(batch_id)

    if not results:
        raise HTTPException(status_code=404, detail="No results found for this batch")

    # Calculate statistics
    total_files = len(results)
    success_count = sum(1 for r in results if r["status"] == "completed")
    failure_count = sum(1 for r in results if r["status"] == "failed")

    # Average score (only for completed)
    completed_results = [r for r in results if r["status"] == "completed"]
    average_score = (
        sum(r["score"] for r in completed_results) / len(completed_results)
        if completed_results
        else 0
    )

    # Simplify results for response
    simplified_results = [
        {
            "fileName": r["fileName"],
            "rollNumber": r["rollNumber"],
            "score": r["score"],
            "maxScore": r["maxScore"],
            "percentage": r["percentage"],
            "status": r["status"],
            "error": r.get("error", ""),
        }
        for r in results
    ]

    return {
        "batchId": batch_id,
        "status": status["status"],
        "totalFiles": total_files,
        "successCount": success_count,
        "failureCount": failure_count,
        "averageScore": round(average_score, 2),
        "results": simplified_results,
        "csvDownloadUrl": f"/api/omr/download/{batch_id}",
    }


@router.get("/download/{batch_id}")
async def download_results(batch_id: str):
    """
    Download results as CSV file

    Args:
        batch_id: Batch identifier

    Returns:
        CSV file download
    """
    logger.info(f"📥 Download request received for batch: {batch_id}")

    # Export batch to CSV
    csv_path = get_batch_csv_export(batch_id)

    if not csv_path or not csv_path.exists():
        logger.error(f"❌ CSV file not found for batch: {batch_id}")
        logger.error(f"   Expected path: {csv_path}")
        raise HTTPException(status_code=404, detail="Results not found")

    logger.info(f"✅ CSV file found: {csv_path}")
    logger.info(f"   File size: {csv_path.stat().st_size} bytes")

    return FileResponse(
        path=str(csv_path),
        media_type="text/csv",
        filename=f"Results_{batch_id}.csv",
        headers={"Content-Disposition": f"attachment; filename=Results_{batch_id}.csv"},
    )


@router.get("/dashboard")
async def get_dashboard():
    """
    Get dashboard statistics

    Returns:
        Overall system statistics
    """
    stats = get_dashboard_stats()

    return {
        "totalBatches": stats["totalBatches"],
        "totalScanned": stats["totalScanned"],
        "totalFailed": stats["totalFailed"],
        "successRate": stats["successRate"],
        "averageScore": stats["averageScore"],
        "recentBatches": stats["recentBatches"],
    }
