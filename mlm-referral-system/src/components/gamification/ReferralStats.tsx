import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import Chart from "chart.js/auto";
import { BarChart, LineChart, PieChart } from "lucide-react";
import { Skeleton } from "../ui/skeleton";

interface ReferralData {
  daily: {
    labels: string[];
    data: number[];
  };
  monthly: {
    labels: string[];
    data: number[];
  };
  distribution: {
    labels: string[];
    data: number[];
  };
}

interface ReferralStatsProps {
  data: ReferralData;
  loading?: boolean;
}

const ChartSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-[30px] w-[200px]" />
    <Skeleton className="h-[300px] w-full" />
  </div>
);

export function ReferralStats({ data, loading = false }: ReferralStatsProps) {
  const dailyChartRef = useRef<HTMLCanvasElement>(null);
  const monthlyChartRef = useRef<HTMLCanvasElement>(null);
  const distributionChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (loading) return;

    if (dailyChartRef.current) {
      const ctx = dailyChartRef.current.getContext("2d");
      if (ctx) {
        new Chart(ctx, {
          type: "bar",
          data: {
            labels: data.daily.labels,
            datasets: [
              {
                label: "Daily Referrals",
                data: data.daily.data,
                backgroundColor: "rgba(99, 102, 241, 0.5)",
                borderColor: "rgb(99, 102, 241)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                align: "end",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  maxTicksLimit: 5,
                },
              },
              x: {
                ticks: {
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 10,
                },
              },
            },
          },
        });
      }
    }

    if (monthlyChartRef.current) {
      const ctx = monthlyChartRef.current.getContext("2d");
      if (ctx) {
        new Chart(ctx, {
          type: "line",
          data: {
            labels: data.monthly.labels,
            datasets: [
              {
                label: "Monthly Referrals",
                data: data.monthly.data,
                borderColor: "rgb(99, 102, 241)",
                tension: 0.3,
                fill: true,
                backgroundColor: "rgba(99, 102, 241, 0.1)",
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "top",
                align: "end",
              },
            },
            scales: {
              y: {
                beginAtZero: true,
                ticks: {
                  maxTicksLimit: 5,
                },
              },
              x: {
                ticks: {
                  maxRotation: 0,
                  autoSkip: true,
                  maxTicksLimit: 12,
                },
              },
            },
          },
        });
      }
    }

    if (distributionChartRef.current) {
      const ctx = distributionChartRef.current.getContext("2d");
      if (ctx) {
        new Chart(ctx, {
          type: "doughnut",
          data: {
            labels: data.distribution.labels,
            datasets: [
              {
                data: data.distribution.data,
                backgroundColor: [
                  "rgba(99, 102, 241, 0.8)",
                  "rgba(59, 130, 246, 0.8)",
                  "rgba(16, 185, 129, 0.8)",
                  "rgba(245, 158, 11, 0.8)",
                ],
                borderColor: "white",
                borderWidth: 2,
              },
            ],
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: "right",
                align: "center",
              },
            },
          },
        });
      }
    }
  }, [data, loading]);

  if (loading) {
    return (
      <div className="space-y-6">
        <ChartSkeleton />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Daily Referrals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <canvas ref={dailyChartRef} />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="h-5 w-5" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <canvas ref={monthlyChartRef} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Level Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <canvas ref={distributionChartRef} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
