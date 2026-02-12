# OMR Grading System - Frontend

A modern Next.js frontend for the OMR (Optical Mark Recognition) batch grading system.

## Features

- 📊 **Dashboard**: View statistics and recent batch processing results
- 📤 **Batch Upload**: Drag-and-drop interface for uploading multiple OMR sheets
- ⏳ **Real-time Processing**: Live progress tracking during batch processing
- 📋 **Results Display**: Detailed results table with CSV download
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **File Upload**: React Dropzone
- **API Client**: Custom fetch-based client

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Backend Integration

The frontend expects a FastAPI backend running on `http://localhost:8000`. Make sure the backend is running before using the frontend.

To change the API URL, update `API_BASE_URL` in `src/lib/api.ts`.

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── layout.tsx         # Root layout with navigation
│   ├── page.tsx           # Dashboard page
│   ├── upload/            # Upload page
│   ├── processing/[batchId]/  # Processing status page
│   └── results/[batchId]/     # Results display page
├── components/            # Reusable UI components
│   ├── UploadZone.tsx     # File upload component
│   ├── ProgressTracker.tsx # Processing progress display
│   └── ResultsTable.tsx   # Results table with CSV download
└── lib/
    └── api.ts             # API client and type definitions
```

## API Endpoints

The frontend communicates with these backend endpoints:

- `POST /api/omr/upload` - Upload batch of OMR files
- `GET /api/omr/status/{batchId}` - Get processing status
- `GET /api/omr/results/{batchId}` - Get final results
- `GET /api/omr/download/{batchId}` - Download CSV results
- `GET /api/omr/dashboard` - Get dashboard statistics

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Quality

The project uses:
- **ESLint** for code linting
- **TypeScript** for type safety
- **Tailwind CSS** for styling

## Deployment

Build the application for production:

```bash
npm run build
npm run start
```

The application will be available on port 3000 by default.

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Contributing

1. Follow the existing code style
2. Add TypeScript types for new features
3. Test components with different screen sizes
4. Update this README for any new features
