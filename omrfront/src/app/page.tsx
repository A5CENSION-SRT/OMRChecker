'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient, DashboardStats } from '@/lib/api';

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const dashboardStats = await apiClient.getDashboardStats();
        setStats(dashboardStats);
      } catch (err) {
        setError('Failed to load dashboard statistics');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OMR Batch Grading System</h1>
          <p className="mt-2 text-gray-600">Upload and process OMR sheets automatically</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📊</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalBatches || 0}</div>
                <div className="text-sm text-gray-500">Total Batches</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📄</div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats?.totalScanned || 0}</div>
                <div className="text-sm text-gray-500">Total Scanned</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl mr-4">✅</div>
              <div>
                <div className="text-2xl font-bold text-green-600">{stats?.successRate.toFixed(1) || 0}%</div>
                <div className="text-sm text-gray-500">Success Rate</div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="text-3xl mr-4">📈</div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{stats?.averageScore.toFixed(1) || 0}/100</div>
                <div className="text-sm text-gray-500">Average Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white p-6 rounded-lg shadow-sm border mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/upload"
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 text-center font-medium"
            >
              📤 Upload New Batch
            </Link>
            <button className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium">
              📋 View All Batches
            </button>
          </div>
        </div>

        {/* Recent Batches */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Batches</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {stats?.recentBatches && stats.recentBatches.length > 0 ? (
              stats.recentBatches.map((batch) => (
                <div key={batch.batchId} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-3 h-3 rounded-full ${batch.status === 'completed' ? 'bg-green-500' :
                        batch.status === 'processing' ? 'bg-blue-500' : 'bg-gray-500'
                      }`} />
                    <div>
                      <div className="font-medium text-gray-900">{batch.batchId}</div>
                      <div className="text-sm text-gray-500">
                        {batch.fileCount} files • {new Date(batch.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${batch.status === 'completed' ? 'bg-green-100 text-green-800' :
                        batch.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                      {batch.status}
                    </span>
                    <Link
                      href={`/results/${batch.batchId}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      View →
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-6 py-8 text-center text-gray-500">
                No batches processed yet. <Link href="/upload" className="text-blue-600 hover:text-blue-800">Upload your first batch</Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
