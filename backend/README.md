# OMR Grading System - Backend API

FastAPI backend for mass OMR sheet grading with single hardcoded template.

## Features

- ✅ Batch upload of OMR images
- ✅ Background asynchronous processing
- ✅ Real-time progress tracking
- ✅ CSV results storage and export
- ✅ Simple REST API (5 endpoints)

## Setup

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Template

The template files are hardcoded in `storage/template/`:
- `template.json` - OMR layout definition
- `evaluation.json` - Answer key
- `config.json` - Processing configuration
- `omr_marker.jpg` - Reference marker image

### 3. Run the Server

```bash
python main.py
```

Server runs on: http://localhost:8000

## API Endpoints

### 1. Upload Batch
```
POST /api/omr/upload
Content-Type: multipart/form-data

Body: files (multiple image files)

Response:
{
  "batchId": "batch_20251024_203000",
  "status": "queued",
  "totalFiles": 10,
  "statusUrl": "/api/omr/status/batch_20251024_203000"
}
```

### 2. Get Status
```
GET /api/omr/status/{batchId}

Response:
{
  "batchId": "batch_20251024_203000",
  "status": "processing",
  "totalFiles": 10,
  "processed": 5,
  "processing": 1,
  "pending": 4,
  "failed": 0,
  "progress": 50,
  "files": [...]
}
```

### 3. Get Results
```
GET /api/omr/results/{batchId}

Response:
{
  "batchId": "batch_20251024_203000",
  "status": "completed",
  "totalFiles": 10,
  "successCount": 10,
  "averageScore": 85.5,
  "results": [
    {
      "fileName": "sheet1.jpg",
      "rollNumber": "E503110026",
      "score": 85,
      "percentage": 85
    }
  ]
}
```

### 4. Download CSV
```
GET /api/omr/download/{batchId}

Returns: CSV file download
```

### 5. Dashboard Stats
```
GET /api/omr/dashboard

Response:
{
  "totalBatches": 5,
  "totalScanned": 342,
  "successRate": 99.12,
  "averageScore": 81.5,
  "recentBatches": [...]
}
```

## Storage Structure

```
storage/
├── uploads/              # Temporary uploaded images
│   └── batch_xxx/
├── results/              # Processed images and master CSV
│   ├── Results_Master.csv
│   └── batch_xxx/
│       └── *_marked.jpg
├── batches/              # Batch metadata JSON files
│   └── batch_xxx.json
└── template/             # Hardcoded template files
    ├── template.json
    ├── evaluation.json
    ├── config.json
    └── omr_marker.jpg
```

## CSV Output Format

The master CSV (`storage/results/Results_Master.csv`) contains:

| Column | Description |
|--------|-------------|
| batchId | Batch identifier |
| fileName | Original filename |
| rollNumber | Extracted roll number |
| totalQuestions | Total questions on sheet |
| correct | Number correct |
| incorrect | Number incorrect |
| unmarked | Number unmarked |
| score | Final score |
| maxScore | Maximum possible score |
| percentage | Score percentage |
| responses | JSON string of all Q&A |
| markedImagePath | Path to marked image |
| status | completed/failed |
| createdAt | Timestamp |
| error | Error message if failed |

## Testing

### Test with sample image:

```bash
curl -X POST http://localhost:8000/api/omr/upload \
  -F "files=@../samples/sample1/MobileCamera/sheet1.jpg"
```

### Check status:

```bash
curl http://localhost:8000/api/omr/status/batch_20251024_203000
```

### Download results:

```bash
curl http://localhost:8000/api/omr/download/batch_20251024_203000 -o results.csv
```

## Architecture

```
FastAPI App
    ↓
Upload Handler → Save files → Queue batch
    ↓
Background Worker → Process OMR → Write CSV
    ↓
Results API → Read CSV → Return data
```

## Performance

- Processing speed: ~1-2 seconds per OMR image
- Concurrent processing: 4 images in parallel
- Upload limit: 50MB per file
- Supports: JPG, JPEG, PNG formats

## Development

### Run in development mode:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### API Documentation:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Error Handling

Common errors:
- `400 Bad Request` - Invalid file format or size
- `404 Not Found` - Batch ID doesn't exist
- `500 Server Error` - Processing failure

Failed OMR sheets are logged in the CSV with `status="failed"` and error message.
