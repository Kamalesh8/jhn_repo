import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getDownlineUsers, getAllDownlineUsers } from "@/services/firebaseService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { UsersIcon, Copy, CheckCircle, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { DownloadPDFButton } from "@/components/ui/download-pdf-button";
import type { User } from "@/types";
import { onSnapshot, collection, getDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Referral {
  id: string;
  name: string;
  email: string;
  referralId: string;
}

const formatDate = (date: Date | string | null | undefined) => {
  if (!date) return "N/A";
  const d = date instanceof Date ? date : new Date(date as string);
  return d.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const Referrals = () => {
  const { userProfile } = useAuth();
  const [downlineUsers, setDownlineUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isSubscribed = true;
    const unsubscribers: (() => void)[] = [];

    const fetchData = async () => {
      if (!userProfile) return;

      try {
        setIsLoading(true);
        console.log("Fetching downline users for user:", userProfile.id);
        
        // Fetch all downline users (including indirect) once
        const allDownline = await getAllDownlineUsers(userProfile.id);
        
        if (!isSubscribed) return;

        // Create a map of userId to user for quick lookup
        const userMap = new Map(allDownline.map(user => [user.id, user]));
        
        // Calculate team sizes using a tree structure
        const calculateTeamSizes = (users: User[]): User[] => {
          const teamSizes = new Map<string, number>();
          const directReferrals = new Map<string, number>();
          
          // First pass: calculate direct referrals
          allDownline.forEach(user => {
            if (user.sponsorId) {
              directReferrals.set(user.sponsorId, (directReferrals.get(user.sponsorId) || 0) + 1);
            }
          });
          
          // Second pass: calculate total team size
          const processed = new Set<string>();
          
          const processUser = (userId: string): number => {
            if (processed.has(userId)) return teamSizes.get(userId) || 0;
            
            const user = userMap.get(userId);
            if (!user) return 0;
            
            const direct = directReferrals.get(userId) || 0;
            
            // Find all users sponsored by this user
            const sponsoredUsers = allDownline.filter(u => u.sponsorId === userId);
            
            // Calculate total team size
            let totalTeamSize = direct;
            for (const sponsored of sponsoredUsers) {
              totalTeamSize += processUser(sponsored.id);
            }
            
            teamSizes.set(userId, totalTeamSize);
            processed.add(userId);
            return totalTeamSize;
          };
          
          // Process all users
          allDownline.forEach(user => processUser(user.id));
          
          // Update users with calculated team sizes
          return users.map(user => ({
            ...user,
            totalTeamSize: teamSizes.get(user.id) || 0,
            directReferrals: directReferrals.get(user.id) || 0
          }));
        };

        if (isSubscribed) {
          const downlineWithTeamSizes = calculateTeamSizes(allDownline);
          setDownlineUsers(downlineWithTeamSizes);
          setFilteredUsers(downlineWithTeamSizes);
        }

      } catch (error) {
        console.error("Error fetching downline data:", error);
        if (isSubscribed) {
          toast.error("Failed to fetch downline data");
        }
      } finally {
        if (isSubscribed) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    // Add real-time updates for user profile changes
    if (userProfile) {
      // Listen for changes to the user's own profile
      const profileUnsubscribe = onSnapshot(doc(db, "users", userProfile.id), (doc) => {
        if (!isSubscribed) return;
        if (doc.exists()) {
          const userData = doc.data() as User;
          setDownlineUsers(prev => prev.map(user => 
            user.id === userData.id ? { ...user, ...userData } : user
          ));
          setFilteredUsers(prev => prev.map(user => 
            user.id === userData.id ? { ...user, ...userData } : user
          ));
        }
      });
      unsubscribers.push(profileUnsubscribe);

      // Listen for changes to referrals
      const referralsUnsubscribe = onSnapshot(
        collection(db, "referrals"),
        async (snapshot) => {
          if (!isSubscribed || !userProfile) return;
          
          const changes = snapshot.docChanges();
          if (changes.length === 0) return;

          // Only process added or modified referrals
          const relevantChanges = changes.filter(change => 
            change.type === "added" || change.type === "modified"
          );

          if (relevantChanges.length > 0) {
            try {
              setIsUpdating(true);
              await fetchData(); // Refetch all data to ensure consistency
            } catch (error) {
              console.error("Error updating downline:", error);
            } finally {
              if (isSubscribed) {
                setIsUpdating(false);
              }
            }
          }
        }
      );
      unsubscribers.push(referralsUnsubscribe);
    }

    return () => {
      isSubscribed = false;
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [userProfile]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const searchTerm = e.target.value.toLowerCase();
    const filtered = downlineUsers.filter(user => 
      user.name.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm) ||
      user.referralId.toLowerCase().includes(searchTerm)
    );
    setFilteredUsers(filtered);
    setSearchQuery(e.target.value);
  };

  const copyReferralLink = (referralId: string) => {
    if (!referralId) {
      console.error("Referral ID is undefined");
      return;
    }

    const link = `${window.location.origin}/register?ref=${referralId}`;
    navigator.clipboard.writeText(link);
    setCopied(referralId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Referrals</h2>
        {isUpdating && (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Updating team size...</span>
          </div>
        )}
      </div>
      <Card>
        <CardHeader>
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
            <div>
              <CardTitle>My Referrals</CardTitle>
              <CardDescription>
                Manage your referral network and track team performance
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search referrals..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="max-w-sm"
              />
              <Button variant="outline" onClick={() => setSearchQuery("")}>Clear</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Team Size</CardTitle>
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {userProfile?.totalTeamSize || downlineUsers.length || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">Total members in your team</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Members</CardTitle>
                  <UsersIcon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{filteredUsers.filter(u => u.status === "active").length}</div>
                  <p className="text-xs text-muted-foreground">Active team members</p>
                </CardContent>
              </Card>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Referral ID</TableHead>
                    <TableHead>Team Size</TableHead>
                    <TableHead>Direct Referrals</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.referralId}</TableCell>
                      <TableCell>{user.totalTeamSize}</TableCell>
                      <TableCell>{user.directReferrals}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "secondary"}>
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copyReferralLink(user.referralId)}
                          className="gap-2"
                        >
                          <Copy className="h-4 w-4" />
                          Copy Referral
                          {copied === user.referralId && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Referrals;
