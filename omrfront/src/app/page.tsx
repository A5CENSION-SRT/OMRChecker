"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  FileCheck,
  TrendingUp,
  CheckCircle2,
  BarChart3,
  Upload,
  Loader2,
  AlertCircle,
  ArrowRight,
  FileSpreadsheet,
} from "lucide-react";
import { apiClient, DashboardStats } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
        setError("Failed to load dashboard statistics");
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();

    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-7xl px-6 lg:px-8 py-12">
        <div className="mb-12 space-y-3">
          <Skeleton className="h-12 w-[350px]" />
          <Skeleton className="h-6 w-[600px]" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-[120px]" />
                <Skeleton className="h-6 w-6 rounded-full" />
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-10 w-[80px]" />
                <Skeleton className="h-4 w-[140px]" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="mx-auto flex max-w-[500px] flex-col items-center justify-center text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 mb-6">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">
              Unable to Load Dashboard
            </h1>
            <p className="text-base text-muted-foreground mb-8">{error}</p>
            <Button size="lg" asChild>
              <Link href="/upload">
                <Upload className="mr-2 h-5 w-5" />
                Upload New Batch
              </Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-6 lg:px-8 py-12">
      {/* Header */}
      <div className="mb-12">
        <h1 className="text-5xl font-bold tracking-tight mb-3">Dashboard</h1>
        <p className="text-lg text-muted-foreground">
          Monitor your OMR processing system and batch statistics
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">
              Total Batches
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <FileCheck className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">
              {stats?.totalBatches || 0}
            </div>
            <p className="text-sm text-muted-foreground">Processed batches</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">
              Total Scanned
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold mb-1">
              {stats?.totalScanned || 0}
            </div>
            <p className="text-sm text-muted-foreground">
              OMR sheets processed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">
              Success Rate
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600 mb-1">
              {stats?.successRate.toFixed(1) || 0}%
            </div>
            <p className="text-sm text-muted-foreground">
              Successfully processed
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base font-medium">
              Average Score
            </CardTitle>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-purple-600 mb-1">
              {stats?.averageScore.toFixed(1) || 0}
            </div>
            <p className="text-sm text-muted-foreground">Out of 100 marks</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Actions Section */}
      <Tabs defaultValue="omr" className="mb-12">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="omr" className="text-base">
            <Upload className="mr-2 h-4 w-4" />
            OMR Upload
          </TabsTrigger>
          <TabsTrigger value="excel" className="text-base">
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Excel Answers
          </TabsTrigger>
        </TabsList>

        <TabsContent value="omr" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-dashed hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">Upload New Batch</CardTitle>
                <CardDescription className="text-base">
                  Process OMR sheets by uploading multiple images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg" asChild>
                  <Link href="/upload">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Batch
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Processing Statistics</CardTitle>
                <CardDescription className="text-base">
                  Current system metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-base">
                  <span className="text-muted-foreground">Failed Sheets</span>
                  <span className="font-semibold font-mono">
                    {stats?.totalFailed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between text-base">
                  <span className="text-muted-foreground">Success Rate</span>
                  <span className="font-semibold text-green-600 font-mono">
                    {stats?.successRate.toFixed(1) || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="excel" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-dashed hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="text-xl">Upload Answer Key</CardTitle>
                <CardDescription className="text-base">
                  Upload Excel file containing correct answers for evaluation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg" asChild>
                  <Link href="/upload/answers">
                    <FileSpreadsheet className="mr-2 h-5 w-5" />
                    Upload Excel
                  </Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-xl">Answer Key Format</CardTitle>
                <CardDescription className="text-base">
                  Required Excel structure
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-2">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-muted-foreground">
                      Column A: Question numbers (1, 2, 3...)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-muted-foreground">
                      Column B: Correct answers (A, B, C, D)
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                    <span className="text-muted-foreground">
                      Save as .xlsx or .xls format
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Recent Batches */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Recent Batches</CardTitle>
          <CardDescription className="text-base">
            Recently processed OMR batches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {stats?.recentBatches && stats.recentBatches.length > 0 ? (
              stats.recentBatches.map((batch) => (
                <div
                  key={batch.batchId}
                  className="flex items-center justify-between p-5 border rounded-lg hover:bg-accent/50 transition-all hover:shadow-md"
                >
                  <div className="flex items-center gap-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <FileCheck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <div className="font-semibold text-base font-mono mb-1">
                        {batch.batchId}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {batch.fileCount} files •{" "}
                        {new Date(batch.createdAt).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      className={`inline-flex items-center rounded-full px-3 py-1.5 text-sm font-semibold ${
                        batch.status === "completed"
                          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                          : batch.status === "processing"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400"
                      }`}
                    >
                      {batch.status === "processing" && (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      )}
                      {batch.status}
                    </div>
                    <Button variant="ghost" size="default" asChild>
                      <Link href={`/results/${batch.batchId}`}>
                        View Results
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-6">
                  <FileCheck className="h-10 w-10 text-muted-foreground" />
                </div>
                <h3 className="font-semibold text-2xl mb-2">No batches yet</h3>
                <p className="text-base text-muted-foreground mb-6 max-w-md">
                  Get started by uploading your first OMR batch for automatic
                  processing and grading
                </p>
                <Button size="lg" asChild>
                  <Link href="/upload">
                    <Upload className="mr-2 h-5 w-5" />
                    Upload Now
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
