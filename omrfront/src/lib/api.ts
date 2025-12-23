// API client for OMR Grading System
const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api";

export interface UploadResponse {
  batchId: string;
  status: string;
  totalFiles: number;
  queuedAt: string;
  statusUrl: string;
}

export interface BatchStatus {
  batchId: string;
  status: string;
  totalFiles: number;
  processed: number;
  processing: number;
  pending: number;
  failed: number;
  progress: number;
  estimatedTimeRemaining: number;
  files: FileStatus[];
}

export interface FileStatus {
  fileName: string;
  status: string;
  score?: number;
  percentage?: string;
  progress?: number;
}

export interface BatchResults {
  batchId: string;
  status: string;
  totalFiles: number;
  successCount: number;
  failureCount: number;
  averageScore: number;
  results: Result[];
  csvDownloadUrl: string;
}

export interface Result {
  fileName: string;
  rollNumber?: string;
  score: number;
  percentage: number;
  status: string;
}

export interface DashboardStats {
  totalBatches: number;
  totalScanned: number;
  totalFailed: number;
  successRate: number;
  averageScore: number;
  recentBatches: RecentBatch[];
}

export interface RecentBatch {
  batchId: string;
  fileCount: number;
  status: string;
  createdAt: string;
}

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Upload batch of OMR images
  async uploadBatch(
    files: File[],
    batchName?: string,
  ): Promise<UploadResponse> {
    const formData = new FormData();

    files.forEach((file) => {
      formData.append("files", file);
    });

    if (batchName) {
      formData.append("batchName", batchName);
    }

    const response = await fetch(`${this.baseUrl}/omr/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get batch processing status
  async getBatchStatus(batchId: string): Promise<BatchStatus> {
    const response = await fetch(`${this.baseUrl}/omr/status/${batchId}`);

    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json();
  }

  // Get batch results
  async getBatchResults(batchId: string): Promise<BatchResults> {
    const response = await fetch(`${this.baseUrl}/omr/results/${batchId}`);

    if (!response.ok) {
      throw new Error(`Failed to get results: ${response.statusText}`);
    }

    return response.json();
  }

  // Download CSV results
  async downloadResults(batchId: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/omr/download/${batchId}`, {
      method: "GET",
      headers: {
        Accept: "text/csv",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to download results: ${response.statusText} - ${errorText}`,
      );
    }

    const blob = await response.blob();

    // Verify we got a valid blob
    if (blob.size === 0) {
      throw new Error("Downloaded file is empty");
    }

    return blob;
  }

  // Get dashboard statistics
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseUrl}/omr/dashboard`);

    if (!response.ok) {
      throw new Error(`Failed to get dashboard stats: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
