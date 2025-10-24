'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ProgressTracker } from '@/components/ProgressTracker';
import { apiClient, BatchStatus } from '@/lib/api';

export default function ProcessingPage() {
    const params = useParams();
    const router = useRouter();
    const batchId = params.batchId as string;

    const [status, setStatus] = useState<BatchStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [polling, setPolling] = useState(true);

    useEffect(() => {
        if (!batchId) return;

        const fetchStatus = async () => {
            try {
                const batchStatus = await apiClient.getBatchStatus(batchId);
                setStatus(batchStatus);
                setError(null);

                // If completed, redirect to results page
                if (batchStatus.status === 'completed') {
                    setPolling(false);
                    setTimeout(() => {
                        router.push(`/results/${batchId}`);
                    }, 2000); // Give user time to see completion
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to get status');
                setPolling(false);
            } finally {
                setLoading(false);
            }
        };

        // Initial fetch
        fetchStatus();

        // Set up polling if still processing
        const interval = setInterval(() => {
            if (polling) {
                fetchStatus();
            }
        }, 2000); // Poll every 2 seconds

        return () => clearInterval(interval);
    }, [batchId, polling, router]);

    const handleRefresh = () => {
        setLoading(true);
        setError(null);
        // Trigger a new fetch by updating state
        setStatus(null);
    };

    if (loading && !status) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading batch status...</p>
                </div>
            </div>
        );
    }

    if (error && !status) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-red-600 mb-4">⚠️ {error}</div>
                    <Link
                        href="/upload"
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                        Upload New Batch
                    </Link>
                </div>
            </div>
        );
    }

    if (!status) return null;

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
                    <h1 className="text-3xl font-bold text-gray-900">
                        Processing Batch: {batchId}
                    </h1>
                    <p className="mt-2 text-gray-600">
                        {status.totalFiles} files • Status: {status.status}
                    </p>
                </div>

                {/* Progress Overview */}
                <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold text-gray-900">Processing Progress</h2>
                        <button
                            onClick={handleRefresh}
                            className="text-blue-600 hover:text-blue-800 text-sm"
                            disabled={loading}
                        >
                            🔄 Refresh
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">{status.totalFiles}</div>
                            <div className="text-sm text-gray-500">Total</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">{status.processed}</div>
                            <div className="text-sm text-gray-500">Completed</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{status.processing}</div>
                            <div className="text-sm text-gray-500">Processing</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{status.failed}</div>
                            <div className="text-sm text-gray-500">Failed</div>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Overall Progress</span>
                            <span>{status.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${status.progress}%` }}
                            />
                        </div>
                        {status.estimatedTimeRemaining > 0 && (
                            <div className="text-xs text-gray-500">
                                Estimated time remaining: {Math.ceil(status.estimatedTimeRemaining / 60)} minutes
                            </div>
                        )}
                    </div>
                </div>

                {/* Detailed Progress */}
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <ProgressTracker
                        files={status.files}
                        totalFiles={status.totalFiles}
                        processed={status.processed}
                        processing={status.processing}
                        failed={status.failed}
                    />
                </div>

                {/* Completion Message */}
                {status.status === 'completed' && (
                    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center">
                            <div className="text-green-600 mr-2">✅</div>
                            <div>
                                <div className="text-green-800 font-medium">Processing Complete!</div>
                                <div className="text-green-600 text-sm">
                                    Redirecting to results page in a few seconds...
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex">
                            <div className="text-red-600">⚠️ {error}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}