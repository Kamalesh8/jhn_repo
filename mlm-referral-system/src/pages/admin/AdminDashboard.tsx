import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { getDashboardData } from "@/services/firebaseService";
import { formatCurrency } from "@/lib/utils";
import type { DashboardData } from "@/types";
import {
  Users,
  ArrowDownToLine,
  ArrowUpFromLine,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertCircle,
  Activity
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";

export default function AdminDashboard() {
  const { currentUser, isAdmin } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    totalUsers: 0,
    totalWithdrawals: 0,
    totalDeposits: 0,
    totalCommissions: 0,
    systemBalance: 0,
    dailyTransactions: 0,
    recentUsers: [],
    recentWithdrawals: [],
    recentDeposits: []
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const data = await getDashboardData();
      setDashboardData(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to fetch dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();

    // Refresh data every minute
    const intervalId = setInterval(fetchData, 60000);

    // Refresh data when window regains focus
    const onFocus = () => {
      console.log("Window focused, refreshing data...");
      fetchData();
    };
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(intervalId);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchData]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      case "failed":
      case "rejected":
        return <Badge className="bg-red-500"><AlertCircle className="mr-1 h-3 w-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchData}
          disabled={loading}
        >
          {loading ? (
            <div className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <ArrowDownToLine className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Active members in the system</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <ArrowDownToLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalDeposits)}</div>
            <p className="text-xs text-muted-foreground">Total amount deposited</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <ArrowUpFromLine className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalWithdrawals)}</div>
            <p className="text-xs text-muted-foreground">Total amount withdrawn</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.totalCommissions)}</div>
            <p className="text-xs text-muted-foreground">Total commissions paid</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Balance</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(dashboardData.systemBalance)}</div>
            <p className="text-xs text-muted-foreground">Current system balance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Transactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.dailyTransactions}</div>
            <p className="text-xs text-muted-foreground">Transactions in last 24h</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Tabs defaultValue="users">
          <TabsList>
            <TabsTrigger value="users">Recent Users</TabsTrigger>
            <TabsTrigger value="withdrawals">Recent Withdrawals</TabsTrigger>
            <TabsTrigger value="deposits">Recent Deposits</TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Users</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left">Name</th>
                      <th className="text-left">Sponsor</th>
                      <th className="text-left">Referral Date</th>
                      <th className="text-left">Team Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboardData.recentUsers.map((user) => (
                      <tr key={user.id} className="border-t">
                        <td className="py-2">
                          <p className="font-medium">{user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </td>
                        <td>
                          {user.sponsorId ? (
                            <p className="text-sm">{user.sponsorName || 'Unknown Sponsor'}</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">Direct Registration</p>
                          )}
                        </td>
                        <td>
                          <p className="text-sm">{formatDate(user.createdAt)}</p>
                        </td>
                        <td>
                          <p className="text-sm">{user.totalTeamSize}</p>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="withdrawals" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Withdrawals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentWithdrawals.map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{withdrawal.userName || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(withdrawal.amount)}</p>
                      </div>
                      <div className="text-right">
                        <div>{getStatusBadge(withdrawal.status)}</div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(withdrawal.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="deposits" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Deposits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.recentDeposits.map((deposit) => (
                    <div key={deposit.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{deposit.userName || 'Unknown User'}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(deposit.amount)}</p>
                      </div>
                      <div className="text-right">
                        <div>{getStatusBadge(deposit.status)}</div>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(deposit.createdAt)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
