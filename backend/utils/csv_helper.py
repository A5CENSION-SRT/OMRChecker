"""
CSV Helper Functions for Results Management
"""
import json
import logging
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
import pandas as pd

from config import RESULTS_DIR, RESULTS_CSV_NAME

# Get logger (configured in main.py)
logger = logging.getLogger(__name__)

# Results CSV path
RESULTS_CSV_PATH = RESULTS_DIR / RESULTS_CSV_NAME


def initialize_results_csv():
    """Initialize the master results CSV file if it doesn't exist"""
    if not RESULTS_CSV_PATH.exists():
        RESULTS_DIR.mkdir(parents=True, exist_ok=True)
        
        logger.info(f"📊 Creating new results CSV at: {RESULTS_CSV_PATH}")
        
        # Create CSV with headers
        df = pd.DataFrame(columns=[
            "batchId",
            "fileName",
            "rollNumber",
            "totalQuestions",
            "correct",
            "incorrect",
            "unmarked",
            "score",
            "maxScore",
            "percentage",
            "responses",
            "markedImagePath",
            "status",
            "createdAt",
            "error"
        ])
        df.to_csv(RESULTS_CSV_PATH, index=False)
        logger.info(f"✅ Results CSV initialized successfully")
    else:
        logger.info(f"📊 Results CSV already exists at: {RESULTS_CSV_PATH}")
    
    return RESULTS_CSV_PATH


def append_result_to_csv(batch_id: str, result: Dict):
    """
    Append a single result to the master CSV
    
    Args:
        batch_id: Batch identifier
        result: Dictionary containing processing result
    """
    # Ensure CSV exists
    initialize_results_csv()
    
    logger.info(f"💾 Appending result to CSV: {result.get('fileName', 'unknown')}")
    
    # Prepare row data
    row = {
        "batchId": batch_id,
        "fileName": result.get("fileName", ""),
        "rollNumber": result.get("rollNumber", ""),
        "totalQuestions": result.get("totalQuestions", 0),
        "correct": result.get("correct", 0),
        "incorrect": result.get("incorrect", 0),
        "unmarked": result.get("unmarked", 0),
        "score": result.get("score", 0),
        "maxScore": result.get("maxScore", 0),
        "percentage": result.get("percentage", 0),
        "responses": json.dumps(result.get("responses", {})),
        "markedImagePath": result.get("markedImagePath", ""),
        "status": result.get("status", "unknown"),
        "createdAt": result.get("processedAt", datetime.now().isoformat()),
        "error": result.get("error", "")
    }
    
    logger.info(f"   📝 CSV Row: Batch={batch_id}, File={row['fileName']}, Score={row['score']}/{row['maxScore']}, Status={row['status']}")
    
    # Append to CSV
    df = pd.DataFrame([row])
    df.to_csv(RESULTS_CSV_PATH, mode='a', header=False, index=False)
    
    logger.info(f"✅ Result saved to CSV successfully: {RESULTS_CSV_PATH}")


def get_batch_results(batch_id: str) -> List[Dict]:
    """
    Get all results for a specific batch
    
    Args:
        batch_id: Batch identifier
    
    Returns:
        List of result dictionaries
    """
    if not RESULTS_CSV_PATH.exists():
        return []
    
    # Read CSV
    df = pd.read_csv(RESULTS_CSV_PATH)
    
    # Filter by batch ID
    batch_df = df[df["batchId"] == batch_id]
    
    # Convert to list of dicts
    results = []
    for _, row in batch_df.iterrows():
        result = row.to_dict()
        
        # Replace NaN/inf values with appropriate defaults
        for key, value in result.items():
            if pd.isna(value):
                if key in ['score', 'maxScore', 'percentage', 'correct', 'incorrect', 'unmarked', 'totalQuestions']:
                    result[key] = 0
                elif key in ['rollNumber', 'error']:
                    result[key] = ""
                else:
                    result[key] = None
            elif isinstance(value, float) and (value == float('inf') or value == float('-inf')):
                result[key] = 0
        
        # Parse JSON responses
        if pd.notna(result.get("responses")) and result.get("responses"):
            try:
                result["responses"] = json.loads(result["responses"])
            except:
                result["responses"] = {}
        else:
            result["responses"] = {}
        
        results.append(result)
    
    return results


def get_batch_csv_export(batch_id: str) -> Optional[Path]:
    """
    Create a CSV file for a specific batch
    
    Args:
        batch_id: Batch identifier
    
    Returns:
        Path to exported CSV file
    """
    if not RESULTS_CSV_PATH.exists():
        return None
    
    # Read CSV
    df = pd.read_csv(RESULTS_CSV_PATH)
    
    # Filter by batch ID
    batch_df = df[df["batchId"] == batch_id]
    
    if batch_df.empty:
        return None
    
    # Export to new file
    export_path = RESULTS_DIR / f"Results_{batch_id}.csv"
    batch_df.to_csv(export_path, index=False)
    
    return export_path


def get_dashboard_stats() -> Dict:
    """
    Get overall statistics for dashboard
    
    Returns:
        Dictionary with aggregated statistics
    """
    if not RESULTS_CSV_PATH.exists():
        return {
            "totalBatches": 0,
            "totalScanned": 0,
            "totalFailed": 0,
            "successRate": 0,
            "averageScore": 0,
            "recentBatches": []
        }
    
    # Read CSV
    df = pd.read_csv(RESULTS_CSV_PATH)
    
    if df.empty:
        return {
            "totalBatches": 0,
            "totalScanned": 0,
            "totalFailed": 0,
            "successRate": 0,
            "averageScore": 0,
            "recentBatches": []
        }
    
    # Calculate stats
    total_scanned = len(df)
    total_failed = len(df[df["status"] == "failed"])
    total_completed = len(df[df["status"] == "completed"])
    success_rate = (total_completed / total_scanned * 100) if total_scanned > 0 else 0
    
    # Average score (only completed)
    completed_df = df[df["status"] == "completed"]
    if not completed_df.empty and 'score' in completed_df.columns:
        avg_score = completed_df["score"].mean()
        average_score = avg_score if pd.notna(avg_score) and avg_score != float('inf') else 0
    else:
        average_score = 0
    
    # Unique batches
    total_batches = df["batchId"].nunique()
    
    # Recent batches
    recent_batches = []
    for batch_id in df["batchId"].unique()[-5:]:
        batch_df = df[df["batchId"] == batch_id]
        created_at = batch_df["createdAt"].iloc[0] if not batch_df.empty else ""
        # Handle NaN in createdAt
        if pd.isna(created_at):
            created_at = ""
        recent_batches.append({
            "batchId": batch_id,
            "fileCount": len(batch_df),
            "status": "completed" if all(batch_df["status"] == "completed") else "mixed",
            "createdAt": str(created_at)
        })
    
    return {
        "totalBatches": int(total_batches),
        "totalScanned": int(total_scanned),
        "totalFailed": int(total_failed),
        "successRate": round(float(success_rate), 2) if success_rate != float('inf') else 0,
        "averageScore": round(float(average_score), 2) if average_score != float('inf') else 0,
        "recentBatches": recent_batches[::-1]  # Reverse to show newest first
    }
