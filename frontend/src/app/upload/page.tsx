"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UploadZone } from "@/components/UploadZone";
import { apiClient } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, FileSpreadsheet } from "lucide-react";

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [batchName, setBatchName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleFilesSelected = (selectedFiles: File[]) => {
    setFiles(selectedFiles);
    setError(null);
  };

  const handleExcelSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
      ];
      if (!validTypes.includes(file.type)) {
        setError("Please upload a valid Excel file (.xlsx or .xls)");
        return;
      }
      setExcelFile(file);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const response = await apiClient.uploadBatch(
        files,
        batchName || undefined,
      );
      router.push(`/processing/${response.batchId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleExcelUpload = async () => {
    if (!excelFile) {
      setError("Please select an Excel file");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // TODO: Implement Excel upload API call
      console.log("Uploading Excel file:", excelFile.name);

      const response = await apiClient.uploadexcel(
        [excelFile],
        batchName || undefined,
      );

      console.log("responseori osidhfjo ", response);

      alert("Answer key uploaded successfully!");
      setExcelFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
          >
            ← Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Upload Center</h1>
          <p className="mt-2 text-gray-600">
            Upload OMR sheets or Excel answer keys
          </p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="omr" className="w-full gap-5">
          <TabsList className="grid w-full grid-cols-2 mb-6 bg-white gap-5">
            <TabsTrigger value="omr" className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              OMR Sheets
            </TabsTrigger>
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Answer Key
            </TabsTrigger>
          </TabsList>

          {/* OMR Upload Tab */}
          <TabsContent value="omr">
            {/* Upload Zone */}
            <div className="bg-white p-8 rounded-lg shadow-sm border mb-6">
              <UploadZone
                onFilesSelected={handleFilesSelected}
                disabled={uploading}
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Selected Files ({files.length})
                </h2>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded"
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-gray-500">📄</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                            {file.name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                        disabled={uploading}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Batch Name */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <label
                htmlFor="batchName"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Batch Name (Optional)
              </label>
              <input
                type="text"
                id="batchName"
                value={batchName}
                onChange={(e) => setBatchName(e.target.value)}
                placeholder="e.g., Section A - Tuesday"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={uploading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="text-red-600">⚠️ {error}</div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-center">
              <button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className={`px-8 py-3 rounded-lg font-medium text-white ${
                  files.length === 0 || uploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  `Upload ${files.length} File${files.length !== 1 ? "s" : ""}`
                )}
              </button>
            </div>
          </TabsContent>

          {/* Excel Upload Tab */}
          <TabsContent value="excel">
            {/* Format Instructions */}
            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Answer Key Format
              </h2>
              <div className="space-y-3 text-sm text-gray-700">
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <strong>Column A:</strong> Question numbers (1, 2, 3...)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <strong>Column B:</strong> Correct answers (A, B, C, D)
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-green-600 font-bold">✓</span>
                  <div>
                    <strong>File Format:</strong> Save as .xlsx or .xls
                  </div>
                </div>
              </div>
            </div>

            {/* Excel File Upload */}
            <div className="bg-white p-8 rounded-lg shadow-sm border mb-6">
              <label
                htmlFor="excelFile"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Select Excel File
              </label>
              <input
                type="file"
                id="excelFile"
                accept=".xlsx,.xls"
                onChange={handleExcelSelected}
                disabled={uploading}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer border border-gray-300 rounded-md"
              />

              {excelFile && (
                <div className="mt-4 flex items-center justify-between py-2 px-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    <span className="text-green-600">📊</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {excelFile.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {(excelFile.size / 1024).toFixed(2)} KB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setExcelFile(null)}
                    className="text-red-600 hover:text-red-800 p-1"
                    disabled={uploading}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="text-red-600">⚠️ {error}</div>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div className="flex justify-center">
              <button
                onClick={handleExcelUpload}
                disabled={!excelFile || uploading}
                className={`px-8 py-3 rounded-lg font-medium text-white ${
                  !excelFile || uploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
              >
                {uploading ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Uploading...</span>
                  </div>
                ) : (
                  "Upload Answer Key"
                )}
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
