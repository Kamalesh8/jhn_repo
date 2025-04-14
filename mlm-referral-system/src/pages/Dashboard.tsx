import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  getWalletByUserId, 
  getDownlineUsers,
  getTransactionsByUserId, 
  getWithdrawalRequestsByUserId 
} from "@/services/firebaseService";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import type { Wallet, Transaction, User, WithdrawalRequest } from "@/types";
import { Timestamp } from "firebase/firestore";
import {
  CurrencyDollarIcon,
  ArrowDownIcon,
  GiftIcon,
  UserGroupIcon,
  ClipboardIcon,
  CheckIcon,
  ClockIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";

export default function Dashboard() {
  const { userProfile, currentUser } = useAuth();
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [downlineUsers, setDownlineUsers] = useState<User[]>([]);
  const [copied, setCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser || !userProfile) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchData = async () => {
      try {
        // Fetch wallet data
        const walletData = await getWalletByUserId(userProfile.id);
        if (isMounted) setWallet(walletData);

        // Fetch recent transactions
        const recentTransactions = await getTransactionsByUserId(userProfile.id);
        if (isMounted) {
          setTransactions(
            recentTransactions
              .sort((a, b) => {
                const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
                const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
                return bTime - aTime;
              })
              .slice(0, 10)
          );
        }

        // Fetch withdrawal requests
        const withdrawals = await getWithdrawalRequestsByUserId(userProfile.id);
        if (isMounted) {
          setWithdrawalRequests(
            withdrawals
              .sort((a, b) => {
                const aTime = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
                const bTime = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
                return bTime - aTime;
              })
              .slice(0, 10)
          );
        }

        // Fetch downline users
        const users = await getDownlineUsers(userProfile.id);
        if (isMounted) setDownlineUsers(users);

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentUser, userProfile]);


  const copyReferralLink = () => {
    if (!userProfile) return;
    const referralLink = `${window.location.origin}/register?ref=${userProfile.referralId}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (date: Date | string | Timestamp | null | undefined) => {
    if (!date) return "-";
    if (date instanceof Timestamp) {
      return date.toDate().toLocaleDateString();
    }
    return new Date(date as string).toLocaleDateString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
      case "approved":
        return <Badge className="bg-green-500"><CheckIcon className="mr-1 h-3 w-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><ClockIcon className="mr-1 h-3 w-3" /> Pending</Badge>;
      case "failed":
      case "rejected":
        return <Badge className="bg-red-500"><ExclamationCircleIcon className="mr-1 h-3 w-3" /> {status.charAt(0).toUpperCase() + status.slice(1)}</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <CurrencyDollarIcon className="h-5 w-5 text-green-500" />;
      case "withdrawal":
        return <ArrowDownIcon className="h-5 w-5 text-red-500" />;
      case "level_income":
        return <UserGroupIcon className="h-5 w-5 text-blue-500" />;
      case "sponsor_income":
        return <UserGroupIcon className="h-5 w-5 text-purple-500" />;
      case "profit_share":
        return <CurrencyDollarIcon className="h-5 w-5 text-amber-500" />;
      default:
        return <ClipboardIcon className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team Size</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile?.totalTeamSize || 0}</div>
            <p className="text-xs text-muted-foreground">Total members in your team</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Direct Referrals</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userProfile?.directReferrals || 0}</div>
            <p className="text-xs text-muted-foreground">Directly referred members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(wallet?.balance || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Total Invested: {formatCurrency(wallet?.totalInvested || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Level Income</CardTitle>
            <UserGroupIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(userProfile?.levelIncome || 0)}</div>
            <p className="text-xs text-muted-foreground">
              From {userProfile?.totalTeamSize || 0} team members
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <CurrencyDollarIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(
                (userProfile?.levelIncome || 0) +
                (userProfile?.sponsorIncome || 0) +
                (userProfile?.profitShare || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              All earnings combined
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <Tabs defaultValue="transactions">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Activity History</CardTitle>
                <TabsList>
                  <TabsTrigger value="transactions">Transactions</TabsTrigger>
                  <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
                </TabsList>
              </div>
              <CardDescription>
                Your latest activities across all categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-[200px] items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : (
                <>
                  <TabsContent value="transactions" className="space-y-4">
                    {transactions.length > 0 ? (
                      transactions.map((transaction) => (
                        <div
                          key={transaction.id}
                          className="flex items-center justify-between space-x-4"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="rounded-full bg-muted p-2">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-none">
                                {transaction.description}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(transaction.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatCurrency(transaction.amount)}
                              </p>
                            </div>
                            {getStatusBadge(transaction.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-muted-foreground">
                        No transactions found
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="withdrawals" className="space-y-4">
                    {withdrawalRequests.length > 0 ? (
                      withdrawalRequests.map((request) => (
                        <div
                          key={request.id}
                          className="flex items-center justify-between space-x-4"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="rounded-full bg-muted p-2">
                              <ArrowDownIcon className="h-5 w-5 text-red-500" />
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-none">
                                Withdrawal Request
                                {request.transactionId && (
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    (ID: {request.transactionId})
                                  </span>
                                )}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(request.createdAt)}
                                {request.processedAt && (
                                  <span className="ml-2 text-xs">
                                    • Processed: {formatDate(request.processedAt)}
                                  </span>
                                )}
                              </p>
                              {request.remarks && (
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {request.remarks}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatCurrency(request.amount)}
                              </p>
                            </div>
                            {getStatusBadge(request.status)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center text-sm text-muted-foreground">
                        No withdrawal requests found
                      </div>
                    )}
                  </TabsContent>
                </>
              )}
            </CardContent>
          </Tabs>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Your Network</CardTitle>
            <CardDescription>
              Share your referral link to grow your network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Referral Link</p>
                    <p className="text-xs text-muted-foreground break-all">
                      {userProfile
                        ? `${window.location.origin}/register?ref=${userProfile.referralId}`
                        : "Loading..."}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyReferralLink}
                    className="shrink-0"
                  >
                    {copied ? (
                      <CheckIcon className="h-4 w-4" />
                    ) : (
                      <ClipboardIcon className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Tabs defaultValue="direct" className="w-full">
                <TabsList className="w-full">
                  <TabsTrigger value="direct" className="w-full">Direct</TabsTrigger>
                  <TabsTrigger value="all" className="w-full">All</TabsTrigger>
                </TabsList>
                <TabsContent value="direct" className="mt-4">
                  {isLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : downlineUsers.filter(user => user.sponsorId === userProfile?.id).length > 0 ? (
                    <div className="space-y-4">
                      {downlineUsers
                        .filter(user => user.sponsorId === userProfile?.id)
                        .map((user) => (
                          <div
                            key={user.id}
                            className="flex items-center justify-between space-x-4"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="rounded-full bg-muted p-2">
                                <UserGroupIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="text-sm font-medium leading-none">
                                  {user.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {user.email}
                                </p>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm text-muted-foreground">
                                {formatDate(user.createdAt)}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed">
                      <UserGroupIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                      <h3 className="font-medium">No direct referrals yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Share your referral link to get started
                      </p>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="all" className="mt-4">
                  {isLoading ? (
                    <div className="flex h-[200px] items-center justify-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    </div>
                  ) : downlineUsers.length > 0 ? (
                    <div className="space-y-4">
                      {downlineUsers.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between space-x-4"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="rounded-full bg-muted p-2">
                              <Users className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium leading-none">
                                {user.name}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Level {user.level}
                              </p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              {formatDate(user.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex h-[200px] flex-col items-center justify-center rounded-lg border border-dashed">
                      <UserGroupIcon className="mb-2 h-8 w-8 text-muted-foreground" />
                      <h3 className="font-medium">No team members yet</h3>
                      <p className="text-sm text-muted-foreground">
                        Build your network to see members here
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
