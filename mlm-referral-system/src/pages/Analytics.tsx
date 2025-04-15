import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from "recharts";
import { getTransactionsByUserId } from "@/services/firebaseService";
import { Transaction } from "@/types";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const ChartSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-[30px] w-[200px]" />
    <Skeleton className="h-[300px] w-full" />
  </div>
);

const StatCardSkeleton = () => (
  <Card>
    <CardHeader>
      <Skeleton className="h-4 w-[150px]" />
    </CardHeader>
    <CardContent>
      <Skeleton className="h-8 w-[100px]" />
    </CardContent>
  </Card>
);

export default function Analytics() {
  const { userProfile } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!userProfile?.id) return;
      
      try {
        setLoading(true);
        setError(null);
        const data = await getTransactionsByUserId(userProfile.id);
        setTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        setError("Failed to load transaction data. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userProfile?.id]);

  // Process data for charts
  const dailyEarnings = transactions.reduce((acc: any[], transaction) => {
    const date = format(transaction.createdAt.toDate(), "MMM dd");
    const existing = acc.find((item) => item.date === date);
    if (existing) {
      existing.amount += transaction.amount;
    } else {
      acc.push({ date, amount: transaction.amount });
    }
    return acc;
  }, []);

  const transactionsByType = transactions.reduce((acc: any[], transaction) => {
    const existing = acc.find((item) => item.type === transaction.type);
    if (existing) {
      existing.value += transaction.amount;
    } else {
      acc.push({ type: transaction.type, value: transaction.amount });
    }
    return acc;
  }, []);

  const incomeBreakdown = [
    { name: "Level Income", value: userProfile?.levelIncome || 0 },
    { name: "Sponsor Income", value: userProfile?.sponsorIncome || 0 },
    { name: "Profit Share", value: userProfile?.profitShare || 0 },
  ];

  if (loading) {
    return (
      <div className="container mx-auto space-y-6 p-4 sm:p-6">
        <Skeleton className="h-10 w-[250px]" />
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
        <ChartSkeleton />
        <div className="grid gap-6 md:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-4 sm:p-6">
        <div className="rounded-lg border bg-card p-8 text-center">
          <h2 className="text-2xl font-semibold text-destructive mb-2">Error</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold">Analytics Overview</h1>

      {/* Stats Overview */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${transactions.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{transactions.length}</div>
            <p className="text-xs text-muted-foreground">
              +12 since last week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(transactions.reduce((sum, t) => sum + t.amount, 0) / (transactions.length || 1)).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              +7% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Earnings Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Daily Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyEarnings}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date"
                  tick={{ fontSize: 12 }}
                  interval={0}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Transaction Types */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={transactionsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {transactionsByType.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Income Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Income Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeBreakdown}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => 
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {incomeBreakdown.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
