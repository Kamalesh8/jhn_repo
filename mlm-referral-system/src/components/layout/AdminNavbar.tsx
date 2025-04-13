import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, BellIcon, User } from "lucide-react";
import { getDashboardData } from "@/services/firebaseService";
import type { DashboardData } from "@/types";
import { formatCurrency } from "@/lib/utils";

interface AdminNavbarProps {
  toggleSidebar: () => void;
}

const AdminNavbar = ({ toggleSidebar }: AdminNavbarProps) => {
  const { userProfile } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <header className="sticky top-0 z-10 border-b bg-white shadow-sm">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="mr-2 md:hidden"
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
          <h1 className="text-lg font-medium md:text-xl">
            Admin Dashboard
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-4 rounded-lg border bg-muted/50 p-2 md:flex">
            <div className="text-center">
              <div className="text-xs text-muted-foreground">System Balance</div>
              <div className="font-medium">
                {dashboardData
                  ? formatCurrency(dashboardData.systemBalance)
                  : "Loading..."}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Users</div>
              <div className="font-medium">
                {dashboardData ? dashboardData.totalUsers : "Loading..."}
              </div>
            </div>
            <div className="text-center">
              <div className="text-xs text-muted-foreground">Daily Txns</div>
              <div className="font-medium">
                {dashboardData ? dashboardData.dailyTransactions : "Loading..."}
              </div>
            </div>
          </div>

          <div className="relative">
            <Button variant="outline" size="icon">
              <BellIcon className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 justify-center rounded-full p-0">
                3
              </Badge>
              <span className="sr-only">Notifications</span>
            </Button>
          </div>

          <Avatar>
            <AvatarImage
              src={undefined}
              alt={userProfile?.name || "Admin"}
            />
            <AvatarFallback className="bg-primary text-primary-foreground">
              {userProfile?.name
                ? userProfile.name.charAt(0).toUpperCase()
                : "A"}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
