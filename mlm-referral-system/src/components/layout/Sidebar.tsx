import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/contexts/AuthContext";
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
} from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const Sidebar = ({ open, setOpen }: SidebarProps) => {
  const location = useLocation();
  const { logout, isAdmin } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/dashboard", icon: Home },
    { name: "My Referrals", href: "/referrals", icon: Users },
    { name: "Add Funds", href: "/add-funds", icon: ArrowDownToLine },
    { name: "Withdraw", href: "/withdraw", icon: ArrowUpFromLine },
    { name: "Transactions", href: "/transactions", icon: ClipboardList },
    { name: "Profile", href: "/profile", icon: User },
    ...(isAdmin ? [{ name: "Admin Panel", href: "/admin/dashboard", icon: Settings }] : []),
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const SidebarContent = () => (
    <div className="flex h-full flex-col overflow-y-auto bg-white">
      <div className="flex h-16 shrink-0 items-center border-b px-6">
        <Link to="/dashboard" className="flex items-center">
          <IndianRupee className="mr-2 h-6 w-6 text-primary" />
          <span className="text-xl font-bold text-primary">MLM System</span>
        </Link>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <nav className="flex-1 space-y-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t p-4">
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Logout
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="p-0">
          <SidebarContent />
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:block">
        <div className="h-full w-64 border-r bg-white">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};

export default Sidebar;
