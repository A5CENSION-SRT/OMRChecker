'use client';

import { Result } from '@/lib/api';

interface ResultsTableProps {
    results: Result[];
    batchId: string;
    onDownloadCsv: () => void;
}

export function ResultsTable({ results, batchId, onDownloadCsv }: ResultsTableProps) {
    const totalFiles = results.length;
    const successCount = results.filter(r => r.status === 'completed').length;
    const failureCount = totalFiles - successCount;
    const averageScore = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + (r.score || 0), 0) / results.length)
        : 0;

    return (
        <div className="space-y-6">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-gray-900">{totalFiles}</div>
                    <div className="text-sm text-gray-500">Total Files</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-green-600">{successCount}</div>
                    <div className="text-sm text-gray-500">Successful</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-red-600">{failureCount}</div>
                    <div className="text-sm text-gray-500">Failed</div>
                </div>
                <div className="bg-white p-4 rounded-lg border">
                    <div className="text-2xl font-bold text-blue-600">{averageScore}/100</div>
                    <div className="text-sm text-gray-500">Average Score</div>
                </div>
            </div>

            {/* Download Button */}
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900">
                    Results for Batch {batchId}
                </h2>
                <button
                    onClick={onDownloadCsv}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                    📥 Download CSV
                </button>
            </div>

            {/* Results Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    File Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Roll Number
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Score
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Percentage
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {results.map((result, index) => (
                                <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {result.fileName}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {result.rollNumber || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {result.score}/100
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {result.percentage}%
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${result.status === 'completed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {result.status === 'completed' ? '✓ Completed' : '✗ Failed'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}