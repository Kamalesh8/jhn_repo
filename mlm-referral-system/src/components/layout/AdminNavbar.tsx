import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu, BellIcon, User, Settings } from "lucide-react";
import { getDashboardData } from "@/services/firebaseService";
import type { DashboardData } from "@/types";
import { formatCurrency } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface AdminNavbarProps {
  toggleSidebar: () => void;
}

const AdminNavbar = ({ toggleSidebar }: AdminNavbarProps) => {
  const { userProfile, logout } = useAuth();
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto">
        <div className="flex h-16 items-center justify-between gap-4 px-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="lg:hidden"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
            <h1 className="text-lg font-semibold md:text-xl">
              Admin Dashboard
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden items-center divide-x rounded-lg border bg-muted/50 px-4 py-2 md:flex">
              <div className="pr-4 text-center">
                <div className="text-xs text-muted-foreground">System Balance</div>
                <div className="font-medium">
                  {dashboardData
                    ? formatCurrency(dashboardData.systemBalance)
                    : "Loading..."}
                </div>
              </div>
              <div className="px-4 text-center">
                <div className="text-xs text-muted-foreground">Users</div>
                <div className="font-medium">
                  {dashboardData ? dashboardData.totalUsers : "Loading..."}
                </div>
              </div>
              <div className="pl-4 text-center">
                <div className="text-xs text-muted-foreground">Daily Txns</div>
                <div className="font-medium">
                  {dashboardData ? dashboardData.dailyTransactions : "Loading..."}
                </div>
              </div>
            </div>

            <Button variant="ghost" size="icon" className="relative">
              <BellIcon className="h-5 w-5 text-gray-500" />
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 h-4 w-4 items-center justify-center rounded-full p-0 text-xs"
              >
                3
              </Badge>
              <span className="sr-only">Notifications</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 select-none rounded-full bg-transparent p-0 hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-2 focus-visible:ring-offset-2"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarImage
                      src={userProfile?.avatar}
                      alt={userProfile?.name || "Admin"}
                    />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {userProfile?.name
                        ? userProfile.name.charAt(0).toUpperCase()
                        : "A"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {userProfile?.name || "Admin"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {userProfile?.email || "admin@example.com"}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-red-600 focus:bg-red-50 focus:text-red-600"
                  onClick={handleLogout}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminNavbar;
