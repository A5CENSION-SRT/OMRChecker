# OMR Grading System - MVP Plan (Single Template, No Database)

## 🎯 MVP Core Principle
**Mass upload OMR sheets → Automatic grading → CSV results export**

Only ONE hardcoded OMR template. No template management. Focus on speed and accuracy of bulk processing.

---

## 🏗️ Simplified Architecture

```
┌─────────────────────────────┐
│     Next.js Frontend        │
│  (Upload + Dashboard)       │
└────────────┬────────────────┘
             │ REST API
             ↓
┌─────────────────────────────┐
│  FastAPI Backend            │
│  (File handling + Queue)    │
└────────────┬────────────────┘
             │
        ┌────┴─────────────────┐
        ↓                      ↓
   ┌──────────┐         ┌─────────────┐
   │CSV Files │         │OMRChecker   │
   │(Results) │         │(Processing) │
   └──────────┘         └─────────────┘
```

---

## 📁 Project Structure

```
backend/
├── main.py                    # FastAPI app entry point
├── config.py                  # Hardcoded paths and settings
├── routes/
│   └── omr.py                 # 4 endpoints: upload, status, results, download
├── workers/
│   └── processor.py           # Background OMR processing worker
├── utils/
│   └── omr_helper.py          # Wrapper around OMRChecker
├── storage/
│   ├── uploads/               # Temporary uploaded files
│   ├── results/
│   │   └── Results_{timestamp}.csv
│   └── template/
│       ├── template.json      # HARDCODED TEMPLATE
│       └── answer_key.json    # HARDCODED ANSWER KEY
└── requirements.txt

frontend/
├── app/
│   ├── page.tsx               # Landing/Dashboard
│   ├── upload/
│   │   └── page.tsx           # Upload page
│   ├── results/
│   │   └── page.tsx           # Results view
│   └── api/
│       └── [internal API calls]
├── components/
│   ├── UploadZone.tsx
│   ├── ProgressTracker.tsx
│   └── ResultsTable.tsx
└── lib/
    └── api.ts                 # API client functions
```

---

## 📊 File Storage Strategy (CSV-Based)

### **Uploads Directory** (`storage/uploads/`)
```
uploads/
├── batch_001_2025-10-24_20-30/
│   ├── sheet1.jpg
│   ├── sheet2.jpg
│   ├── sheet3.jpg
│   └── metadata.json          # {batchId, totalFiles, status, createdAt}
├── batch_002_2025-10-24_21-00/
│   └── ...
```

### **Results CSV** (`storage/results/Results_{YYYY-MM-DD_HH-MM}.csv`)
```
batchId,fileName,rollNumber,totalQuestions,correct,incorrect,unmarked,score,maxScore,percentage,responses,markedImagePath,status,createdAt,error

batch_001,sheet1.jpg,E503110026,100,85,10,5,85,100,85%,"{'q1':'B','q2':'A',...}",results/batch_001/sheet1_marked.jpg,completed,2025-10-24T20:30:00Z,

batch_001,sheet2.jpg,E503110027,100,92,5,3,92,100,92%,"{'q1':'A','q2':'B',...}",results/batch_001/sheet2_marked.jpg,completed,2025-10-24T20:31:00Z,

batch_001,sheet3.jpg,,100,0,0,100,0,100,0%,"{}",results/batch_001/sheet3_marked.jpg,failed,2025-10-24T20:32:00Z,"No markers detected"
```

### **Key CSV Columns**
- **batchId**: Groups files uploaded together
- **fileName**: Original filename
- **rollNumber**: Extracted from OMR (optional)
- **responses**: JSON string of all Q&A
- **score/maxScore**: Calculated grade
- **percentage**: Score percentage
- **markedImagePath**: Link to processed image
- **status**: completed/failed/processing
- **error**: Error message if failed

---

## 🔌 API Endpoints (Only 4!)

### **1. POST /api/omr/upload**
**Purpose**: Upload batch of OMR images

```
Request (multipart/form-data):
{
  "files": [file1.jpg, file2.jpg, file3.jpg],
  "batchName": "Section A - Tuesday" (optional)
}

Response (202 Accepted):
{
  "batchId": "batch_001_2025-10-24_20-30",
  "status": "queued",
  "totalFiles": 3,
  "queuedAt": "2025-10-24T20:30:00Z",
  "statusUrl": "/api/omr/status/batch_001_2025-10-24_20-30"
}
```

### **2. GET /api/omr/status/{batchId}**
**Purpose**: Get batch processing progress

```
Response (200):
{
  "batchId": "batch_001_2025-10-24_20-30",
  "status": "processing",
  "totalFiles": 3,
  "processed": 1,
  "processing": 1,
  "pending": 1,
  "failed": 0,
  "progress": 33,
  "estimatedTimeRemaining": 5,
  "files": [
    {
      "fileName": "sheet1.jpg",
      "status": "completed",
      "score": 85,
      "percentage": "85%"
    },
    {
      "fileName": "sheet2.jpg",
      "status": "processing",
      "progress": 60
    },
    {
      "fileName": "sheet3.jpg",
      "status": "queued"
    }
  ]
}
```

### **3. GET /api/omr/results/{batchId}**
**Purpose**: Get final results for a batch

```
Response (200):
{
  "batchId": "batch_001_2025-10-24_20-30",
  "status": "completed",
  "totalFiles": 3,
  "successCount": 3,
  "failureCount": 0,
  "averageScore": 87.33,
  "results": [
    {
      "fileName": "sheet1.jpg",
      "rollNumber": "E503110026",
      "score": 85,
      "percentage": 85,
      "status": "completed"
    },
    {
      "fileName": "sheet2.jpg",
      "rollNumber": "E503110027",
      "score": 89,
      "percentage": 89,
      "status": "completed"
    },
    {
      "fileName": "sheet3.jpg",
      "rollNumber": "E503110028",
      "score": 88,
      "percentage": 88,
      "status": "completed"
    }
  ],
  "csvDownloadUrl": "/api/omr/download/batch_001_2025-10-24_20-30"
}
```

### **4. GET /api/omr/download/{batchId}**
**Purpose**: Download results as CSV file

```
Response: Binary CSV file
Header: Content-Disposition: attachment; filename="Results_batch_001.csv"
Content: Complete CSV with all results from Results_{timestamp}.csv
```

### **BONUS: GET /api/omr/dashboard**
**Purpose**: Get dashboard statistics

```
Response (200):
{
  "totalBatches": 5,
  "totalScanned": 342,
  "totalFailed": 3,
  "successRate": 99.12,
  "averageScore": 81.5,
  "recentBatches": [
    {
      "batchId": "batch_005",
      "fileCount": 50,
      "status": "completed",
      "createdAt": "2025-10-24T20:00:00Z"
    }
  ]
}
```

---

## 🗃️ Data Storage (CSV Only)

### **Main Results File**
```
storage/results/Results_2025-10-24_20-30.csv
```
**When**: New batch starts → append all results here

### **Batch Metadata** (Optional JSON for quick lookup)
```
storage/batches/batch_001.json
{
  "batchId": "batch_001",
  "batchName": "Section A - Tuesday",
  "totalFiles": 3,
  "successCount": 3,
  "failureCount": 0,
  "startedAt": "2025-10-24T20:30:00Z",
  "completedAt": "2025-10-24T20:35:00Z",
  "processingTimeSeconds": 300
}
```

### **Reading Results**
- Keep CSV in memory as pandas DataFrame
- Filter by batchId, date, score range
- Sort by score, date, etc.
- Export specific batch to CSV download

---

## ⚙️ Processing Workflow

### **Step 1: Upload**
```
User uploads 10 OMR images
↓
API receives files → validates (format, size)
↓
Create unique batchId: "batch_001_2025-10-24_20-30"
↓
Store files in: storage/uploads/batch_001_2025-10-24_20-30/
↓
Create batch metadata JSON
↓
Queue 10 processing jobs
↓
Return batchId to frontend (202 Accepted)
```

### **Step 2: Background Processing**
```
Worker picks job from queue
↓
Read image from storage/uploads/batch_001.../
↓
Run OMRChecker with hardcoded template
↓
Extract responses: {'q1': 'B', 'q2': 'A', ...}
↓
Compare with hardcoded answer_key.json
↓
Calculate score + percentage
↓
Create marked image
↓
Save to storage/results/batch_001/sheet1_marked.jpg
↓
Append row to Results_{timestamp}.csv
↓
Update batch metadata (processed count++)
↓
Return "completed" status
```

### **Step 3: Results Retrieval**
```
Frontend polls GET /api/omr/status/{batchId}
↓
Backend reads batch metadata JSON
↓
Returns progress (50 of 100 processed)
↓
When complete, frontend calls GET /api/omr/results/{batchId}
↓
Backend reads Results CSV, filters by batchId
↓
Returns all results + download link
```

### **Step 4: Download**
```
User clicks "Download CSV"
↓
GET /api/omr/download/{batchId}
↓
Backend filters Results CSV for that batchId
↓
Returns CSV file download
```

---

## 🎯 Hardcoded Configuration

### **Template (Fixed)**
File: `storage/template/template.json`
```json
{
  "pageDimensions": [1846, 1500],
  "bubbleDimensions": [40, 40],
  "fieldBlocks": {
    "MCQ_Block_Q1": {
      "fieldType": "QTYPE_MCQ4",
      "fieldLabels": ["q1..100"],
      "bubblesGap": 59,
      "labelsGap": 50,
      "origin": [121, 860]
    }
  },
  "preProcessors": [
    {"name": "CropPage", "options": {"morphKernel": [10, 10]}},
    {"name": "CropOnMarkers", "options": {"relativePath": "omr_marker.jpg"}}
  ]
}
```

### **Answer Key (Fixed)**
File: `storage/template/answer_key.json`
```json
{
  "options": {"should_explain_scoring": false},
  "marking_schemes": {
    "default": {
      "questions": "q1..100",
      "marking": {
        "correct": 1,
        "incorrect": 0,
        "unmarked": 0
      }
    }
  }
}
```

### **Processing Config (Fixed)**
File: `storage/template/config.json`
```json
{
  "dimensions": {
    "processing_width": 1500,
    "processing_height": 1200
  },
  "outputs": {
    "show_image_level": 0,
    "save_detections": true
  }
}
```

---

## 🖥️ Frontend Pages (Simple)

### **Page 1: Dashboard** (`/`)
```
┌─────────────────────────────────┐
│   OMR Batch Grading System      │
├─────────────────────────────────┤
│  Total Scanned: 342             │
│  Success Rate: 99.12%           │
│  Average Score: 81.5/100        │
├─────────────────────────────────┤
│  [Upload New Batch] [View All]  │
├─────────────────────────────────┤
│  Recent Batches:                │
│  ├─ batch_005 (50 files) ✓      │
│  ├─ batch_004 (30 files) ✓      │
│  └─ batch_003 (45 files) ✓      │
└─────────────────────────────────┘
```

### **Page 2: Upload** (`/upload`)
```
┌─────────────────────────────────┐
│   Upload OMR Sheets             │
├─────────────────────────────────┤
│  ┌─────────────────────────────┐ │
│  │  Drag files here or click   │ │
│  │   to select multiple JPGs    │ │
│  └─────────────────────────────┘ │
├─────────────────────────────────┤
│  Batch Name: [________________] │
│  [Upload] button               │
└─────────────────────────────────┘
```

### **Page 3: Processing Status** (`/processing/{batchId}`)
```
┌─────────────────────────────────┐
│   Batch: batch_001 (50 files)   │
├─────────────────────────────────┤
│  Progress: ████████░░░░░░░░░░   │
│  45 of 50 completed (90%)       │
│  Processing: 1 | Pending: 4     │
├─────────────────────────────────┤
│  File Status:                   │
│  ✓ sheet1.jpg - 85/100          │
│  ✓ sheet2.jpg - 92/100          │
│  ⏳ sheet3.jpg - Processing...  │
│  ⏳ sheet4.jpg - Queued...      │
│  ⏳ sheet5.jpg - Queued...      │
├─────────────────────────────────┤
│  [↻ Refresh] [Download CSV]     │
└─────────────────────────────────┘
```

### **Page 4: Results** (`/results/{batchId}`)
```
┌──────────────────────────────────┐
│   Results: Batch_001 (Completed) │
├──────────────────────────────────┤
│  Total: 50 | Success: 50         │
│  Avg Score: 86.5/100             │
├──────────────────────────────────┤
│  File       | Roll#   | Score    │
│  ────────────────────────────────│
│  sheet1.jpg | E5031.. | 85/100   │
│  sheet2.jpg | E5031.. | 92/100   │
│  sheet3.jpg | E5031.. | 88/100   │
│  ...        | ...     | ...      │
├──────────────────────────────────┤
│  [Download CSV] [View Details]   │
└──────────────────────────────────┘
```

---

## 🚀 Implementation Steps

### **Phase 1: Backend Setup** (Day 1)
- [x] Create FastAPI project structure
- [x] Setup 4 API endpoints (stub responses)
- [x] Create storage directories
- [x] Copy template + answer key to storage

### **Phase 2: Processing Engine** (Day 2-3)
- [x] Integrate OMRChecker wrapper
- [x] Setup Celery/RQ background worker
- [x] Implement CSV writing logic
- [x] Add error handling

### **Phase 3: Frontend** (Day 4-5)
- [x] Create 4 pages (Dashboard, Upload, Processing, Results)
- [x] Implement file drag-drop
- [x] Add real-time status polling
- [x] Create results table + CSV download

### **Phase 4: Testing & Polish** (Day 6)
- [x] Test batch processing
- [x] Handle edge cases
- [x] Performance optimization
- [x] Deployment

---

## 📦 Technology Stack

### **Backend**
```
FastAPI                    # Web framework
Celery/RQ                  # Task queue
OMRChecker                 # Core engine
pandas                     # CSV handling
python-multipart          # File uploads
aiofiles                   # Async file ops
```

### **Frontend**
```
Next.js 14                # Framework
React Dropzone           # File upload
TanStack Query           # API fetching
Tailwind CSS            # Styling
Axios                   # HTTP client
```

---

## 📊 CSV File Example

**Results_2025-10-24.csv**
```csv
batchId,fileName,rollNumber,totalQuestions,correct,incorrect,unmarked,score,maxScore,percentage,responses,markedImagePath,status,createdAt,error
batch_001,sheet1.jpg,E503110026,100,85,10,5,85,100,85%,"{""q1"":""B"",""q2"":""A""}",results/batch_001/sheet1_marked.jpg,completed,2025-10-24T20:30:00Z,
batch_001,sheet2.jpg,E503110027,100,92,5,3,92,100,92%,"{""q1"":""A"",""q2"":""B""}",results/batch_001/sheet2_marked.jpg,completed,2025-10-24T20:31:00Z,
batch_001,sheet3.jpg,,100,0,0,100,0,100,0%,"{}",results/batch_001/sheet3_marked.jpg,failed,2025-10-24T20:32:00Z,"No markers detected"
```

---

## ✅ MVP Checklist

- [ ] Single hardcoded template works
- [ ] Batch upload accepts 50+ files
- [ ] Background workers process in parallel
- [ ] Results written to CSV correctly
- [ ] Frontend shows real-time progress
- [ ] CSV download works
- [ ] Error handling for failed scans
- [ ] Dashboard shows stats
- [ ] Processing time < 2 seconds per image
- [ ] UI is clean and intuitive

---

## 🎯 Success Criteria

- **Upload Speed**: 50 files in < 5 seconds
- **Processing Speed**: 60+ OMRs/minute
- **Accuracy**: > 98% correct detection
- **UI Response**: < 500ms per API call
- **CSV Export**: Works in < 1 second
- **Error Handling**: Graceful failure with clear messages

---

## 📝 Notes

1. **No Database**: Everything stored as CSV + JSON metadata
2. **Hardcoded**: Template, answer key, processing config are fixed
3. **Stateless**: Each request independent, can restart any time
4. **Simple Scaling**: Just add more worker instances
5. **Easy Debugging**: All files visible in storage directory

This is a true MVP - minimal features, maximum functionality! 🚀
