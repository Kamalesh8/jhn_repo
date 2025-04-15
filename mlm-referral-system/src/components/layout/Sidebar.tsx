import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  DollarSign,
  ArrowDownToLine,
  ArrowUpFromLine,
  ClipboardList,
  User,
  LogOut,
  Settings,
  IndianRupee,
  LineChart,
  Trophy,
  Wallet,
  HelpCircle,
  X,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

  const navigation = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: Home,
      current: location.pathname === "/dashboard",
    },
    {
      name: "My Network",
      href: "/dashboard/referrals",
      icon: Users,
      current: location.pathname === "/dashboard/referrals",
    },
    {
      name: "Analytics",
      href: "/dashboard/analytics",
      icon: LineChart,
      current: location.pathname === "/dashboard/analytics",
    },
    {
      name: "Add Funds",
      href: "/dashboard/add-funds",
      icon: ArrowDownToLine,
      current: location.pathname === "/dashboard/add-funds",
    },
    {
      name: "Withdraw",
      href: "/dashboard/withdraw",
      icon: ArrowUpFromLine,
      current: location.pathname === "/dashboard/withdraw",
    },
    {
      name: "Transactions",
      href: "/dashboard/transactions",
      icon: ClipboardList,
      current: location.pathname === "/dashboard/transactions",
    },
    {
      name: "Profile",
      href: "/dashboard/profile",
      icon: User,
      current: location.pathname === "/dashboard/profile",
    },
  ];

  const adminNavigation = [
    {
      name: "Dashboard",
      href: "/admin",
      icon: Home,
      current: location.pathname === "/admin",
    },
    {
      name: "Users",
      href: "/admin/users",
      icon: Users,
      current: location.pathname === "/admin/users",
    },
    {
      name: "Transactions",
      href: "/admin/transactions",
      icon: ClipboardList,
      current: location.pathname === "/admin/transactions",
    },
    {
      name: "Withdrawals",
      href: "/admin/withdrawals",
      icon: IndianRupee,
      current: location.pathname === "/admin/withdrawals",
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: location.pathname === "/admin/settings",
    },
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-zinc-900/80 lg:hidden",
          open ? "block" : "hidden"
        )}
        onClick={() => setOpen(false)}
      />

      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-lg transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-16 items-center justify-between gap-2 border-b px-4 lg:h-[61px]">
          <Link to="/" className="flex items-center gap-2 font-semibold">
            <Trophy className="h-6 w-6 text-primary" />
            <span>MLM System</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(false)}
            className="lg:hidden"
          >
            <X className="h-6 w-6" />
          </Button>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
          <nav className="flex flex-1 flex-col p-4">
            <div className="space-y-1">
              {(isAdmin ? adminNavigation : navigation).map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group flex items-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:bg-gray-50",
                    item.current
                      ? "bg-primary/10 text-primary"
                      : "text-gray-700 hover:text-primary"
                  )}
                >
                  <item.icon
                    className={cn(
                      "mr-3 h-5 w-5",
                      item.current
                        ? "text-primary"
                        : "text-gray-400 group-hover:text-primary"
                    )}
                  />
                  {item.name}
                </Link>
              ))}
            </div>
          </nav>
        </ScrollArea>

        <div className="border-t p-4">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-5 w-5 text-gray-400" />
            Logout
          </Button>
        </div>
      </div>
    </>
  );
}
