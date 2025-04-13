import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { getWalletByUserId } from "@/services/firebaseService";
import { useState, useEffect } from "react";
import { formatCurrency } from "@/lib/utils";
import {
  Menu,
  BellIcon,
  User as UserIcon
} from "lucide-react";
import type { Wallet } from "@/types";

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const { userProfile } = useAuth();
  const [walletData, setWalletData] = useState<Wallet | null>(null);

  useEffect(() => {
    const fetchWalletData = async () => {
      if (userProfile) {
        try {
          const wallet = await getWalletByUserId(userProfile.id);
          setWalletData(wallet);
        } catch (error) {
          console.error("Error fetching wallet data:", error);
        }
      }
    };

    fetchWalletData();
  }, [userProfile]);

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
            Welcome, {userProfile?.name || "User"}
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden rounded-lg border bg-muted/50 p-2 md:block">
            <div className="text-xs text-muted-foreground">Balance</div>
            <div className="font-medium">
              {walletData ? formatCurrency(walletData.balance) : "Loading..."}
            </div>
          </div>

          <Button variant="outline" size="icon">
            <BellIcon className="h-5 w-5" />
            <span className="sr-only">Notifications</span>
          </Button>

          <Link to="/profile">
            <Avatar>
              <AvatarImage
                src={undefined}
                alt={userProfile?.name || "User"}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {userProfile?.name
                  ? userProfile.name.charAt(0).toUpperCase()
                  : "U"}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
