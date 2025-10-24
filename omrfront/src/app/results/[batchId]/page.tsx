'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ResultsTable } from '@/components/ResultsTable';
import { apiClient, BatchResults } from '@/lib/api';

export default function ResultsPage() {
    const params = useParams();
    const batchId = params.batchId as string;

    const [results, setResults] = useState<BatchResults | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [downloading, setDownloading] = useState(false);

    useEffect(() => {
        if (!batchId) return;

        const fetchResults = async () => {
            try {
                const batchResults = await apiClient.getBatchResults(batchId);
                setResults(batchResults);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to get results');
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [batchId]);

    const handleDownloadCsv = async () => {
        if (!batchId) return;

        setDownloading(true);
        try {
            const blob = await apiClient.downloadResults(batchId);

            // Create download link
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Results_${batchId}.csv`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to download CSV');
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading results...</p>
                </div>
            </div>
        );
    }

    if (error || !results) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">⚠️ {error || 'Results not found'}</div>
                    <Link
                        href="/"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/"
                        className="text-blue-600 hover:text-blue-800 mb-4 inline-block"
                    >
                        ← Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">
                        Results: {batchId}
                    </h1>
                    <p className="mt-2 text-gray-600">
                        Batch processing {results.status} • {results.totalFiles} total files
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <div className="flex">
                            <div className="text-red-600">⚠️ {error}</div>
                        </div>
                    </div>
                )}

                {/* Results Table */}
                <ResultsTable
                    results={results.results}
                    batchId={batchId}
                    onDownloadCsv={handleDownloadCsv}
                />

                {/* Download Button (Additional) */}
                <div className="mt-6 flex justify-center">
                    <button
                        onClick={handleDownloadCsv}
                        disabled={downloading}
                        className={`px-8 py-3 rounded-lg font-medium text-white ${downloading
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-green-600 hover:bg-green-700'
                            }`}
                    >
                        {downloading ? (
                            <div className="flex items-center space-x-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                <span>Downloading...</span>
                            </div>
                        ) : (
                            '📥 Download CSV Results'
                        )}
                    </button>
                </div>

                {/* Actions */}
                <div className="mt-8 flex justify-center space-x-4">
                    <Link
                        href="/upload"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Upload New Batch
                    </Link>
                    <Link
                        href="/"
                        className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}