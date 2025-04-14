import { Link } from "react-router-dom";
import { getUserNotifications, markNotificationAsRead } from "../../services/notificationService";
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
import type { Wallet, Notification } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar = ({ toggleSidebar }: NavbarProps) => {
  const { userProfile } = useAuth();
  const [walletData, setWalletData] = useState<Wallet | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userProfile) {
        try {
          const userNotifications = await getUserNotifications(userProfile.id);
          setNotifications(userNotifications);
          setUnreadCount(userNotifications.filter(n => !n.read).length);
        } catch (error) {
          console.error("Error fetching notifications:", error);
        }
      }
    };

    fetchNotifications();
  }, [userProfile]);

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

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="relative">
                <BellIcon className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadCount}
                  </span>
                )}
                <span className="sr-only">Notifications</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">
                  No notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className={`flex flex-col items-start gap-1 p-4 ${!notification.read ? 'bg-blue-50' : ''}`}
                    onClick={async () => {
                      if (!notification.read) {
                        await markNotificationAsRead(userProfile!.id, notification.id);
                        setNotifications(prev =>
                          prev.map(n =>
                            n.id === notification.id ? { ...n, read: true } : n
                          )
                        );
                        setUnreadCount(prev => prev - 1);
                      }
                      if (notification.link) {
                        window.location.href = notification.link;
                      }
                    }}
                  >
                    <div className="font-medium">{notification.title}</div>
                    <div className="text-sm text-gray-500">{notification.message}</div>
                    <div className="text-xs text-gray-400">
                      {new Date(notification.createdAt).toLocaleDateString()}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link to="/profile">
            <Avatar>
              <AvatarImage
                src={userProfile?.photoURL || undefined}
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
