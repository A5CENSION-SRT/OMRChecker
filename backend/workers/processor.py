"""
Background worker for processing OMR images
Uses asyncio for concurrent processing
"""
import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, List
from datetime import datetime

from backend.utils.omr_helper import get_omr_processor
from backend.utils.csv_helper import append_result_to_csv
from backend.config import BATCHES_DIR, RESULTS_DIR

# Get logger (configured in main.py)
logger = logging.getLogger(__name__)


# In-memory job queue and status
processing_queue: asyncio.Queue = None
batch_status: Dict[str, Dict] = {}


def initialize_worker():
    """Initialize the background worker queue"""
    global processing_queue
    if processing_queue is None:
        processing_queue = asyncio.Queue()


async def process_batch_worker():
    """
    Background worker that processes batches from the queue
    """
    global processing_queue
    
    logger.info("🚀 Background worker started and waiting for batches...")
    
    while True:
        try:
            # Get next batch from queue
            logger.info("⏳ Waiting for next batch in queue...")
            batch_data = await processing_queue.get()
            
            batch_id = batch_data["batchId"]
            image_files = batch_data["imageFiles"]
            
            logger.info(f"📦 Processing batch: {batch_id} with {len(image_files)} files")
            
            # Update status
            batch_status[batch_id]["status"] = "processing"
            batch_status[batch_id]["startedAt"] = datetime.now().isoformat()
            
            # Get OMR processor
            logger.info(f"🔧 Initializing OMR processor for batch {batch_id}")
            processor = get_omr_processor()
            
            # Create output directory for this batch
            batch_output_dir = RESULTS_DIR / batch_id
            batch_output_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"📁 Created output directory: {batch_output_dir}")
            
            # Process each image
            for idx, image_path in enumerate(image_files):
                try:
                    logger.info(f"📄 [{idx+1}/{len(image_files)}] Processing: {Path(image_path).name}")
                    
                    # Update progress
                    batch_status[batch_id]["processing"] = 1
                    batch_status[batch_id]["pending"] = len(image_files) - idx - 1
                    
                    # Process OMR image
                    logger.info(f"🔍 Scanning OMR sheet: {Path(image_path).name}")
                    result = processor.process_omr_image(
                        Path(image_path),
                        save_marked_image=True,
                        output_dir=batch_output_dir
                    )

                    # also save the json of filled answers
                    try:
                        result_json_path = batch_output_dir / f"{Path(image_path).stem}.json"
                        with open(result_json_path, "w") as f:
                            json.dump(result, f, indent=2)
                        logger.info(f"Saved answers json to {result_json_path}")
                    except Exception as e:
                        logger.error(f"Failed to save JSON for {Path(image_path).name}: {e}")

                    
                    # Store in file-level status
                    file_status = batch_status[batch_id]["files"][idx]
                    file_status["status"] = result["status"]
                    file_status["score"] = result.get("score", 0)
                    file_status["percentage"] = result.get("percentage", 0)
                    file_status["error"] = result.get("error", "")
                    
                    if result["status"] == "completed":
                        logger.info(f"✅ SUCCESS: {Path(image_path).name} - Score: {result.get('score', 0)}/{result.get('maxScore', 0)} ({result.get('percentage', 0)}%)")
                        logger.info(f"   📊 Stats: Correct: {result.get('correct', 0)}, Incorrect: {result.get('incorrect', 0)}, Unmarked: {result.get('unmarked', 0)}")
                    else:
                        logger.error(f"❌ FAILED: {Path(image_path).name} - Error: {result.get('error', 'Unknown error')}")
                    
                    # Append to CSV
                    logger.info(f"💾 Saving result to CSV for: {Path(image_path).name}")
                    logger.critical("resilt:  ", result)
                    append_result_to_csv(batch_id, result)
                    
                    # Update counts
                    if result["status"] == "completed":
                        batch_status[batch_id]["processed"] += 1
                    else:
                        batch_status[batch_id]["failed"] += 1
                    
                    batch_status[batch_id]["processing"] = 0
                    
                    progress = ((idx + 1) / len(image_files)) * 100
                    logger.info(f"📈 Progress: {progress:.1f}% ({idx+1}/{len(image_files)} files)")
                    
                except Exception as e:
                    # Handle individual file error
                    logger.error(f"❌ ERROR processing {Path(image_path).name}: {str(e)}", exc_info=True)
                    file_status = batch_status[batch_id]["files"][idx]
                    file_status["status"] = "failed"
                    file_status["error"] = str(e)
                    batch_status[batch_id]["failed"] += 1
                    batch_status[batch_id]["processing"] = 0
            
            # Mark batch as completed
            batch_status[batch_id]["status"] = "completed"
            batch_status[batch_id]["completedAt"] = datetime.now().isoformat()
            batch_status[batch_id]["processing"] = 0
            batch_status[batch_id]["pending"] = 0
            
            logger.info(f"🎉 BATCH COMPLETE: {batch_id}")
            logger.info(f"   ✅ Successful: {batch_status[batch_id]['processed']}")
            logger.info(f"   ❌ Failed: {batch_status[batch_id]['failed']}")
            logger.info(f"   📊 Total: {batch_status[batch_id]['totalFiles']}")
            
            # Save batch metadata
            save_batch_metadata(batch_id)
            logger.info(f"💾 Batch metadata saved to: {BATCHES_DIR / f'{batch_id}.json'}")
            
            # Mark task as done
            processing_queue.task_done()
            logger.info(f"✓ Queue task marked as done for batch: {batch_id}")
            
        except Exception as e:
            logger.error(f"💥 Worker error: {e}", exc_info=True)
            if batch_id in batch_status:
                batch_status[batch_id]["status"] = "failed"
                batch_status[batch_id]["error"] = str(e)
                logger.error(f"❌ Batch {batch_id} marked as failed")


def save_batch_metadata(batch_id: str):
    """Save batch metadata to JSON file"""
    metadata_path = BATCHES_DIR / f"{batch_id}.json"
    BATCHES_DIR.mkdir(parents=True, exist_ok=True)
    
    with open(metadata_path, 'w') as f:
        json.dump(batch_status[batch_id], f, indent=2)


def load_batch_metadata(batch_id: str) -> Dict:
    """Load batch metadata from JSON file"""
    metadata_path = BATCHES_DIR / f"{batch_id}.json"
    
    if not metadata_path.exists():
        return None
    
    with open(metadata_path, 'r') as f:
        return json.load(f)


async def queue_batch_processing(batch_id: str, image_files: List[str]):
    """
    Queue a batch for processing
    
    Args:
        batch_id: Unique batch identifier
        image_files: List of image file paths
    """
    global processing_queue, batch_status
    
    logger.info(f"📥 Queuing batch: {batch_id} with {len(image_files)} files")
    
    # Initialize queue if needed
    if processing_queue is None:
        initialize_worker()
        logger.info("🔧 Worker queue initialized")
    
    # Initialize batch status
    batch_status[batch_id] = {
        "batchId": batch_id,
        "status": "queued",
        "totalFiles": len(image_files),
        "processed": 0,
        "processing": 0,
        "pending": len(image_files),
        "failed": 0,
        "queuedAt": datetime.now().isoformat(),
        "startedAt": None,
        "completedAt": None,
        "files": [
            {
                "fileName": Path(f).name,
                "status": "queued",
                "score": 0,
                "percentage": 0,
                "error": ""
            }
            for f in image_files
        ]
    }
    
    # Add to queue
    await processing_queue.put({
        "batchId": batch_id,
        "imageFiles": image_files
    })
    
    logger.info(f"✅ Batch {batch_id} successfully queued for processing")
    logger.info(f"   Files in batch: {[Path(f).name for f in image_files]}")
    
    return batch_status[batch_id]


def get_batch_status(batch_id: str) -> Dict:
    """
    Get current status of a batch
    
    Args:
        batch_id: Batch identifier
    
    Returns:
        Status dictionary or None if not found
    """
    # Check in-memory status first
    if batch_id in batch_status:
        status = batch_status[batch_id].copy()
        
        # Calculate progress percentage
        total = status["totalFiles"]
        processed = status["processed"] + status["failed"]
        status["progress"] = int((processed / total * 100)) if total > 0 else 0
        
        return status
    
    # Try loading from file
    metadata = load_batch_metadata(batch_id)
    if metadata:
        return metadata
    
    return None
