import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { getUserById, getDownlineUsers, getWalletByUserId } from "../services/firebaseService";
import { User, Wallet } from "../types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Progress } from "../components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Users, Activity, TrendingUp, IndianRupee, ArrowUpRight, ArrowDownRight, Award } from "lucide-react";
import { auth, db } from "../lib/firebase";
import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const { currentUser, userProfile } = useAuth();
  const [downlineUsers, setDownlineUsers] = useState<User[]>([]);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      if (!currentUser?.uid || !userProfile) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch downline users
        const users = await getDownlineUsers(userProfile.id);
        if (isMounted) setDownlineUsers(users);

        // Fetch wallet
        const walletData = await getWalletByUserId(userProfile.id);
        if (isMounted) setWallet(walletData);

      } catch (err) {
        if (isMounted) {
          console.error("Error fetching data:", err);
          setError("Failed to load data. Please try again later.");
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false;
    };
  }, [currentUser?.uid, userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500 bg-red-50 p-4 rounded-lg shadow">
          <p className="font-semibold">{error}</p>
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500 bg-gray-50 p-4 rounded-lg shadow">
          <p className="font-semibold">No user profile found</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/profile">Complete Your Profile</Link>
          </Button>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Direct Referrals",
      value: userProfile.directReferrals,
      description: "Active direct referrals",
      icon: Users,
      trend: userProfile.directReferrals > 0 ? "up" : "neutral",
      color: "blue",
      progress: (userProfile.directReferrals / 10) * 100,
      link: "/dashboard/referrals"
    },
    {
      title: "Total Team Size",
      value: userProfile.totalTeamSize,
      description: "Total network size",
      icon: Activity,
      trend: userProfile.totalTeamSize > 0 ? "up" : "neutral",
      color: "green",
      link: "/dashboard/referrals"
    },
    {
      title: "Available Balance",
      value: `₹${wallet?.balance.toFixed(2) || "0.00"}`,
      description: "Current wallet balance",
      icon: IndianRupee,
      trend: (wallet?.balance || 0) > 0 ? "up" : "neutral",
      color: "yellow",
      link: "/dashboard/transactions"
    },
    {
      title: "Total Earnings",
      value: `₹${(userProfile.levelIncome + userProfile.sponsorIncome + userProfile.profitShare).toFixed(2)}`,
      description: "Combined earnings",
      icon: TrendingUp,
      trend: "up",
      color: "purple",
      link: "/dashboard/transactions"
    }
  ];

  return (
    <div className="container mx-auto p-6">
      {/* Welcome Section */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userProfile.name}!
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your network today.
          </p>
        </div>
        <div className="flex space-x-4">
          <Button asChild>
            <Link to="/dashboard/add-funds">Add Funds</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard/withdraw">Withdraw</Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <Link to={stat.link} key={index}>
            <Card className="hover:shadow-lg transition-shadow duration-200">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-500">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 text-${stat.color}-500`} />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
                  </div>
                  {stat.trend === "up" && (
                    <ArrowUpRight className="h-4 w-4 text-green-500" />
                  )}
                  {stat.trend === "down" && (
                    <ArrowDownRight className="h-4 w-4 text-red-500" />
                  )}
                </div>
                {stat.progress && (
                  <Progress value={stat.progress} className="mt-4 h-1" />
                )}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="earnings" className="space-y-6">
        <TabsList>
          <TabsTrigger value="earnings">Earnings Breakdown</TabsTrigger>
          <TabsTrigger value="referrals">Recent Referrals</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="earnings">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Level Income</CardTitle>
                <CardDescription>Earnings from your network levels</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  ₹{userProfile.levelIncome.toFixed(2)}
                </div>
                <Progress value={75} className="mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sponsor Income</CardTitle>
                <CardDescription>Direct referral bonuses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  ₹{userProfile.sponsorIncome.toFixed(2)}
                </div>
                <Progress value={60} className="mt-4" />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Profit Share</CardTitle>
                <CardDescription>Your share of system profits</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  ₹{userProfile.profitShare.toFixed(2)}
                </div>
                <Progress value={40} className="mt-4" />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>Your latest team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {downlineUsers.slice(0, 5).map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                        <p className="text-sm text-gray-500">Joined {new Date(user.createdAt.seconds * 1000).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      Level {user.level}
                    </div>
                  </div>
                ))}
                {downlineUsers.length > 5 && (
                  <Button variant="outline" className="w-full mt-4" asChild>
                    <Link to="/dashboard/referrals">View All Referrals</Link>
                  </Button>
                )}
                {downlineUsers.length === 0 && (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Referrals Yet</h3>
                    <p className="text-gray-500 mb-4">Start growing your network today!</p>
                    <Button asChild>
                      <Link to="/dashboard/referrals">Get Your Referral Link</Link>
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>Milestones and rewards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userProfile.achievements?.map((achievement, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                    <Award className="h-8 w-8 text-yellow-500" />
                    <div>
                      <p className="font-medium">{achievement.title}</p>
                      <p className="text-sm text-gray-500">{achievement.description}</p>
                    </div>
                  </div>
                ))}
                {(!userProfile.achievements || userProfile.achievements.length === 0) && (
                  <div className="col-span-full text-center py-6">
                    <Award className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No Achievements Yet</h3>
                    <p className="text-gray-500">Complete tasks to earn achievements!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
