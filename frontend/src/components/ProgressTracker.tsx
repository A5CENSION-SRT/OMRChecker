'use client';

import { FileStatus } from '@/lib/api';

interface ProgressTrackerProps {
    files: FileStatus[];
    totalFiles: number;
    processed: number;
    processing: number;
    failed: number;
}

export function ProgressTracker({
    files,
    totalFiles,
    processed,
    processing,
    failed,
}: ProgressTrackerProps) {
    const progress = totalFiles > 0 ? Math.round((processed / totalFiles) * 100) : 0;

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return '✓';
            case 'processing':
                return '⏳';
            case 'failed':
                return '✗';
            default:
                return '⏳';
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'text-green-600';
            case 'processing':
                return 'text-blue-600';
            case 'failed':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <div className="space-y-6">
            {/* Overall Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Processing Progress</span>
                    <span>{processed} of {totalFiles} completed</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="text-xs text-gray-500">
                    {progress}% complete • {processing} processing • {failed} failed
                </div>
            </div>

            {/* File Status List */}
            <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900">File Status</h3>
                <div className="max-h-64 overflow-y-auto space-y-1">
                    {files.map((file, index) => (
                        <div
                            key={index}
                            className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm"
                        >
                            <div className="flex items-center space-x-2">
                                <span className={getStatusColor(file.status)}>
                                    {getStatusIcon(file.status)}
                                </span>
                                <span className="truncate max-w-xs">{file.fileName}</span>
                            </div>
                            <div className="text-right">
                                {file.status === 'completed' && file.score !== undefined && (
                                    <span className="text-green-600 font-medium">
                                        {file.score}/100 ({file.percentage})
                                    </span>
                                )}
                                {file.status === 'processing' && file.progress !== undefined && (
                                    <span className="text-blue-600">
                                        {file.progress}%
                                    </span>
                                )}
                                {file.status === 'failed' && (
                                    <span className="text-red-600">Failed</span>
                                )}
                                {file.status === 'queued' && (
                                    <span className="text-gray-500">Queued</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}