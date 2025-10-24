# OMRChecker + Next.js Integration Plan

## 📋 Overview

This document outlines a complete strategy for integrating OMRChecker (Python backend) with a Next.js frontend application. The system will allow users to upload OMR sheet images, scan them against answer keys, and retrieve graded results in real-time.

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────┐
│       Next.js Frontend          │
│  (React UI + File Upload)       │
└────────────┬────────────────────┘
             │ HTTP/REST API
             ↓
┌─────────────────────────────────┐
│    Backend API Server           │
│  (Flask/FastAPI + Python)       │
│  - Request routing              │
│  - File management              │
│  - Queue management             │
└────────────┬────────────────────┘
             │
        ┌────┴─────┐
        ↓          ↓
   ┌────────┐  ┌──────────────┐
   │Database│  │OMRChecker    │
   │(Stored │  │ Processing   │
   │ config,│  │ Engine       │
   │ results)  └──────────────┘
   └────────┘       │
                    ↓
              ┌──────────────┐
              │File Storage  │
              │(Images,      │
              │Templates,    │
              │Results)      │
              └──────────────┘
```

---

## 📚 Data Flow (Step-by-Step)

### **Phase 1: Initial Setup**
1. User creates an account (Next.js handles authentication)
2. User uploads or defines an OMR template (template.json) - **Endpoint: POST /api/templates**
3. User uploads an answer key (evaluation.json) - **Endpoint: POST /api/answer-keys**
4. System validates and stores both files

### **Phase 2: OMR Processing**
1. User uploads OMR image(s) one-by-one or in batch - **Endpoint: POST /api/process/upload**
2. Backend receives image and stores temporarily
3. Image is queued for processing
4. OMRChecker processes the image against the template
5. Results are stored in database - **Endpoint: GET /api/process/{sessionId}/status**
6. User can fetch results - **Endpoint: GET /api/results/{resultId}**

### **Phase 3: Result Management**
1. User views all scanned OMRs - **Endpoint: GET /api/results?page=1**
2. User can download individual results or batch export - **Endpoint: GET /api/results/export**
3. User can delete/archive scans - **Endpoint: DELETE /api/results/{resultId}**

---

## 🔌 Detailed API Endpoints

### **1. Template Management**

#### `POST /api/templates`
**Purpose**: Upload a new OMR template
```
Request:
{
  "name": "Math Test Template",
  "description": "Standard math exam for 100 questions",
  "file": <binary_file> (template.json),
  "tags": ["math", "exam", "100questions"]
}

Response (200):
{
  "templateId": "tmpl_123abc",
  "name": "Math Test Template",
  "createdAt": "2025-10-24T20:30:00Z",
  "pageDimensions": [1846, 1500],
  "totalQuestions": 100,
  "fieldBlocks": 12,
  "status": "valid"
}

Error (400):
{
  "error": "Invalid template format",
  "details": "Missing required field: pageDimensions"
}
```

#### `GET /api/templates`
**Purpose**: List all available templates for current user
```
Response (200):
{
  "templates": [
    {
      "templateId": "tmpl_123abc",
      "name": "Math Test Template",
      "createdAt": "2025-10-24T20:30:00Z",
      "totalQuestions": 100,
      "usageCount": 45
    }
  ],
  "total": 1,
  "page": 1
}
```

#### `GET /api/templates/{templateId}`
**Purpose**: Get detailed template information
```
Response (200):
{
  "templateId": "tmpl_123abc",
  "name": "Math Test Template",
  "rawTemplate": { ... full template.json object ... },
  "config": { ... associated config settings ... }
}
```

#### `DELETE /api/templates/{templateId}`
**Purpose**: Delete a template
```
Response (204): No content
Error (409): If template is currently in use
```

---

### **2. Answer Key Management**

#### `POST /api/answer-keys`
**Purpose**: Upload answer key for a template
```
Request:
{
  "templateId": "tmpl_123abc",
  "name": "Math Test - Answer Key v1",
  "file": <binary_file> (evaluation.json),
  "maxScore": 100
}

Response (200):
{
  "keyId": "key_456def",
  "templateId": "tmpl_123abc",
  "name": "Math Test - Answer Key v1",
  "createdAt": "2025-10-24T20:30:00Z",
  "totalQuestions": 100,
  "markingSchemes": ["default", "bonus"],
  "isActive": true
}
```

#### `GET /api/answer-keys?templateId={templateId}`
**Purpose**: Get all answer keys for a template
```
Response (200):
{
  "keys": [
    {
      "keyId": "key_456def",
      "name": "Math Test - Answer Key v1",
      "createdAt": "2025-10-24T20:30:00Z",
      "isActive": true
    }
  ]
}
```

#### `PATCH /api/answer-keys/{keyId}/activate`
**Purpose**: Set this key as the active one for grading
```
Response (200):
{
  "keyId": "key_456def",
  "isActive": true,
  "message": "Answer key activated"
}
```

---

### **3. OMR Processing**

#### `POST /api/process/upload`
**Purpose**: Upload a single OMR image for scanning
```
Request (multipart/form-data):
{
  "image": <binary_file> (sheet1.jpg),
  "templateId": "tmpl_123abc",
  "keyId": "key_456def",
  "rollNumber": "E503110026" (optional),
  "metadata": {
    "batchId": "batch_789",
    "examName": "Mid-term Exam",
    "date": "2025-10-24"
  }
}

Response (202 Accepted - Async Processing):
{
  "jobId": "job_xyz789",
  "status": "queued",
  "message": "OMR scanning queued",
  "estimatedTime": 5,
  "resultUrl": "/api/process/job_xyz789"
}
```

#### `GET /api/process/{jobId}`
**Purpose**: Get processing status or completed result
```
Response (200 - Still Processing):
{
  "jobId": "job_xyz789",
  "status": "processing",
  "progress": 45,
  "message": "Detecting bubbles...",
  "estimatedTimeRemaining": 3
}

Response (200 - Completed):
{
  "jobId": "job_xyz789",
  "status": "completed",
  "resultId": "result_abc123",
  "processingTime": 1.2,
  "result": {
    "fileName": "sheet1.jpg",
    "rollNumber": "E503110026",
    "responses": {
      "q1": "B",
      "q2": "",
      "q3": "D",
      ...
    },
    "score": 85,
    "maxScore": 100,
    "graded": true,
    "markedImageUrl": "/files/results/result_abc123/marked.jpg"
  }
}

Response (400 - Failed):
{
  "jobId": "job_xyz789",
  "status": "failed",
  "error": "No markers detected in image",
  "suggestion": "Upload a clearer image or check template compatibility"
}
```

#### `POST /api/process/batch-upload`
**Purpose**: Upload multiple OMR images for batch processing
```
Request (multipart/form-data):
{
  "images": [<file1>, <file2>, <file3>],
  "templateId": "tmpl_123abc",
  "keyId": "key_456def",
  "batchName": "Section A - Tuesday"
}

Response (202):
{
  "batchId": "batch_xyz789",
  "status": "queued",
  "totalFiles": 3,
  "queuedFiles": 3,
  "estimatedTime": 15,
  "statusUrl": "/api/process/batch/batch_xyz789"
}
```

#### `GET /api/process/batch/{batchId}`
**Purpose**: Get status of batch processing
```
Response (200):
{
  "batchId": "batch_xyz789",
  "status": "processing",
  "totalFiles": 3,
  "processed": 1,
  "processing": 1,
  "pending": 1,
  "failed": 0,
  "progress": 33,
  "files": [
    {
      "fileName": "sheet1.jpg",
      "status": "completed",
      "resultId": "result_abc123"
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

---

### **4. Results Management**

#### `GET /api/results`
**Purpose**: Get all scanned results with filters and pagination
```
Query Parameters:
  ?page=1&limit=20&templateId=tmpl_123abc&status=completed&sortBy=createdAt

Response (200):
{
  "results": [
    {
      "resultId": "result_abc123",
      "fileName": "sheet1.jpg",
      "rollNumber": "E503110026",
      "score": 85,
      "maxScore": 100,
      "percentage": 85,
      "status": "graded",
      "createdAt": "2025-10-24T20:30:00Z",
      "processingTime": 1.2
    }
  ],
  "total": 150,
  "page": 1,
  "pages": 8
}
```

#### `GET /api/results/{resultId}`
**Purpose**: Get detailed result for a specific scan
```
Response (200):
{
  "resultId": "result_abc123",
  "fileName": "sheet1.jpg",
  "rollNumber": "E503110026",
  "templateId": "tmpl_123abc",
  "keyId": "key_456def",
  "responses": {
    "q1": {"marked": "B", "correct": "B", "verdict": "correct", "score": 1},
    "q2": {"marked": "", "correct": "A", "verdict": "unmarked", "score": 0},
    "q3": {"marked": "D", "correct": "D", "verdict": "correct", "score": 1},
    ...
  },
  "score": 85,
  "maxScore": 100,
  "percentage": 85,
  "summary": {
    "totalQuestions": 100,
    "correct": 85,
    "incorrect": 10,
    "unmarked": 5
  },
  "images": {
    "original": "/files/results/result_abc123/original.jpg",
    "marked": "/files/results/result_abc123/marked.jpg",
    "debug": "/files/results/result_abc123/debug_stack.zip"
  },
  "createdAt": "2025-10-24T20:30:00Z"
}
```

#### `DELETE /api/results/{resultId}`
**Purpose**: Delete a result
```
Response (204): No content
```

#### `GET /api/results/export`
**Purpose**: Export results as CSV/Excel
```
Query Parameters:
  ?format=csv&templateId=tmpl_123abc&dateFrom=2025-10-01&dateTo=2025-10-31

Response: Binary file (CSV or Excel)
Header: Content-Disposition: attachment; filename="results_2025-10.csv"
```

#### `POST /api/results/{resultId}/re-evaluate`
**Purpose**: Re-evaluate a result with different answer key
```
Request:
{
  "keyId": "key_999new"
}

Response (200):
{
  "resultId": "result_abc123",
  "oldScore": 85,
  "newScore": 82,
  "responses": { ... updated responses ... }
}
```

---

### **5. Batch Operations**

#### `POST /api/batch-jobs`
**Purpose**: Create a batch job for processing multiple folders
```
Request:
{
  "name": "Exam Session A",
  "templateId": "tmpl_123abc",
  "keyId": "key_456def",
  "scheduledFor": "2025-10-25T10:00:00Z" (optional)
}

Response (201):
{
  "batchJobId": "bj_001",
  "name": "Exam Session A",
  "status": "created",
  "createdAt": "2025-10-24T20:30:00Z"
}
```

#### `GET /api/batch-jobs/{batchJobId}`
**Purpose**: Get batch job details and progress
```
Response (200):
{
  "batchJobId": "bj_001",
  "name": "Exam Session A",
  "status": "in_progress",
  "totalFiles": 150,
  "processed": 45,
  "failed": 2,
  "pending": 103,
  "progress": 30,
  "startedAt": "2025-10-24T20:30:00Z",
  "estimatedCompletion": "2025-10-24T21:00:00Z"
}
```

---

### **6. System/Admin Endpoints**

#### `GET /api/health`
**Purpose**: Check backend server health
```
Response (200):
{
  "status": "healthy",
  "uptime": 3600,
  "activeJobs": 5,
  "queuedJobs": 12
}
```

#### `GET /api/stats`
**Purpose**: Get usage statistics
```
Response (200):
{
  "totalScans": 5420,
  "totalTemplates": 8,
  "totalAnswerKeys": 12,
  "averageProcessingTime": 1.2,
  "successRate": 98.5,
  "recentActivity": {
    "last24Hours": 342,
    "last7Days": 2100
  }
}
```

---

## 🗄️ Database Schema

### **Users Table**
```
users
├── userId (PK)
├── email
├── name
├── createdAt
├── subscription (free/pro/enterprise)
└── apiKey
```

### **Templates Table**
```
templates
├── templateId (PK)
├── userId (FK)
├── name
├── description
├── jsonData (template.json)
├── configData (config.json)
├── pageDimensions
├── totalQuestions
├── createdAt
├── updatedAt
└── isActive
```

### **AnswerKeys Table**
```
answerKeys
├── keyId (PK)
├── userId (FK)
├── templateId (FK)
├── name
├── jsonData (evaluation.json)
├── maxScore
├── isActive
├── createdAt
└── updatedAt
```

### **ProcessingJobs Table**
```
processingJobs
├── jobId (PK)
├── userId (FK)
├── templateId (FK)
├── fileName
├── originalFilePath
├── status (queued/processing/completed/failed)
├── progress (0-100)
├── error (nullable)
├── startedAt
├── completedAt
└── resultId (FK to results, nullable)
```

### **Results Table**
```
results
├── resultId (PK)
├── userId (FK)
├── templateId (FK)
├── keyId (FK)
├── fileName
├── rollNumber
├── rawResponses (JSON)
├── evaluatedResponses (JSON with scores)
├── score
├── maxScore
├── percentage
├── markedImagePath
├── processingTime
├── createdAt
└── updatedAt
```

### **BatchJobs Table**
```
batchJobs
├── batchJobId (PK)
├── userId (FK)
├── name
├── templateId (FK)
├── keyId (FK)
├── status (created/processing/completed/failed)
├── totalFiles
├── processedFiles
├── failedFiles
├── progress
├── scheduledFor (nullable)
├── startedAt
├── completedAt
└── createdAt
```

---

## 📁 File Organization

### **Directory Structure**
```
backend/
├── uploads/
│   └── temp/                    # Temporary upload storage
├── storage/
│   ├── templates/               # Stored template.json files
│   ├── answerkeys/              # Stored evaluation.json files
│   └── results/
│       └── {resultId}/
│           ├── original.jpg     # Original OMR image
│           ├── marked.jpg       # Marked/processed image
│           ├── result.json      # Detailed results
│           └── debug_stack/     # Debug visualization images
└── config/
    └── processing_config.json   # Default OMR processing config
```

---

## 🔄 Processing Workflow

### **Single OMR Processing Flow**
```
1. User uploads OMR image via Next.js
   ↓
2. Backend receives file at POST /api/process/upload
   ↓
3. File validation (format, size, dimensions)
   ↓
4. File stored in temporary storage
   ↓
5. Processing job created in database (status: queued)
   ↓
6. Return jobId to frontend (202 Accepted)
   ↓
7. Frontend polls GET /api/process/{jobId} for status
   ↓
8. Backend worker picks up job (status: processing)
   ↓
9. Run OMRChecker:
   - Apply template
   - Detect bubbles
   - Extract responses
   ↓
10. If answer key exists:
    - Evaluate responses
    - Calculate score
    ↓
11. Save results to database
   ↓
12. Store result images to disk
   ↓
13. Update job status (completed) with resultId
   ↓
14. Frontend fetches result details via GET /api/results/{resultId}
```

### **Batch Processing Flow**
```
1. User uploads multiple files via POST /api/process/batch-upload
   ↓
2. Validate all files and create batch job (status: queued)
   ↓
3. Return batchId to frontend (202 Accepted)
   ↓
4. Create individual processing jobs for each image
   ↓
5. Frontend polls GET /api/process/batch/{batchId}
   ↓
6. Worker processes queue sequentially
   ↓
7. Update batch progress as each file completes
   ↓
8. Return final batch results with statistics
```

---

## 🔐 Security Considerations

### **Authentication**
- JWT tokens for API authentication
- User can only access their own templates/results
- API rate limiting per user

### **File Validation**
- Accept only: JPG, PNG formats
- Maximum file size: 50MB
- Virus scanning before processing
- Filename sanitization

### **Data Privacy**
- Store sensitive data (answer keys) encrypted
- OMR images stored securely with access control
- Audit logging for all operations
- Option to auto-delete results after X days

---

## 🎯 Processing Configuration

### **Default Processing Config**
```json
{
  "dimensions": {
    "processing_width": 1500,
    "processing_height": 1200,
    "display_height": 2480,
    "display_width": 1640
  },
  "outputs": {
    "show_image_level": 0,
    "save_image_level": 1,
    "save_detections": true,
    "filter_out_multimarked_files": true
  },
  "alignment_params": {
    "auto_align": false,
    "match_col": 30,
    "max_steps": 50,
    "stride": 2,
    "thickness": 3
  },
  "threshold_params": {
    "GAMMA_LOW": 0.5
  }
}
```

---

## 📊 Frontend Integration Points (Next.js)

### **Pages/Features Needed**

1. **Dashboard Page**
   - Display stats (total scans, success rate)
   - Quick actions (upload new, view results)
   - Recent activity

2. **Template Management Page**
   - List all templates
   - Upload new template
   - Edit/delete templates
   - Preview template layout

3. **Answer Key Management Page**
   - Upload answer keys
   - Associate with templates
   - Set active key

4. **Upload Page**
   - Drag-and-drop single/multiple files
   - Show real-time processing status
   - Display results after completion

5. **Results Page**
   - Table of all scans
   - Filters (date, template, score range)
   - Pagination
   - Detailed result view
   - Export functionality

6. **Batch Jobs Page**
   - Monitor batch processing
   - See progress updates
   - Bulk download results

---

## 🚀 Implementation Phases

### **Phase 1: Core Backend** (Week 1)
- [ ] Set up Flask/FastAPI server
- [ ] Integrate OMRChecker library
- [ ] Create basic template/answer key APIs
- [ ] Set up database
- [ ] Implement single file processing

### **Phase 2: Advanced Processing** (Week 2)
- [ ] Add batch processing capability
- [ ] Implement job queue (Celery/RQ)
- [ ] Add result storage and retrieval
- [ ] Implement evaluation logic

### **Phase 3: Frontend** (Week 3)
- [ ] Build Next.js pages
- [ ] Implement file upload UI
- [ ] Add real-time status polling
- [ ] Create results display

### **Phase 4: Polish & Deployment** (Week 4)
- [ ] Error handling and logging
- [ ] Performance optimization
- [ ] Security hardening
- [ ] Testing and documentation
- [ ] Deployment

---

## 📝 Technology Stack

### **Backend**
- **Framework**: FastAPI (or Flask)
- **Task Queue**: Celery or RQ (for background processing)
- **Database**: PostgreSQL
- **File Storage**: Local filesystem or S3
- **OMR Engine**: OMRChecker (Python)

### **Frontend**
- **Framework**: Next.js 14+
- **State Management**: TanStack Query or SWR
- **UI Components**: Shadcn/ui or Material-UI
- **File Upload**: React-Dropzone
- **API Client**: Axios or fetch API

---

## ✅ Success Metrics

- Single OMR processing time: < 2 seconds
- Batch processing rate: > 30 OMRs/minute
- API response time: < 500ms (excluding processing)
- System uptime: > 99%
- Accuracy rate: > 98%

---

## 📞 Next Steps

1. **Choose technology stack** (FastAPI vs Flask)
2. **Design database schema** in detail
3. **Set up project structure** for backend
4. **Create API specification** (OpenAPI/Swagger)
5. **Begin Phase 1 implementation**

