import { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  MoreHorizontal,
  Ban,
  CheckCircle,
  Star,
  UserX,
  Loader2,
} from "lucide-react";
import type { User } from "@/types";

export default function ManageUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersRef = collection(db, "users");
      const snapshot = await getDocs(usersRef);
      const usersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || "",
          email: data.email || "",
          phone: data.phone || "",
          isAdmin: data.isAdmin || false,
          status: data.status || "active",
          referralId: data.referralId || "",
          sponsorId: data.sponsorId || null,
          sponsorReferralId: data.sponsorReferralId || null,
          directReferrals: data.directReferrals || 0,
          totalTeamSize: data.totalTeamSize || 0,
          levelIncome: data.levelIncome || 0,
          sponsorIncome: data.sponsorIncome || 0,
          profitShare: data.profitShare || 0,
          level: data.level || 0,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : new Date(),
          lastLogin: data.lastLogin instanceof Timestamp ? data.lastLogin.toDate() : new Date(),
          lastActivity: data.lastActivity instanceof Timestamp ? data.lastActivity.toDate() : new Date()
        } as User;
      });
      setUsers(usersData);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      setActionLoading(userId);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, status: newStatus, updatedAt: new Date() } : user
      ));
      toast.success(`User status updated to ${newStatus}`);
    } catch (error) {
      console.error("Error updating user status:", error);
      toast.error("Failed to update user status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (userId: string, isAdmin: boolean) => {
    try {
      setActionLoading(userId);
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        isAdmin,
        updatedAt: Timestamp.now()
      });
      setUsers(users.map(user => 
        user.id === userId ? { ...user, isAdmin, updatedAt: new Date() } : user
      ));
      toast.success(`User role updated to ${isAdmin ? 'Admin' : 'User'}`);
    } catch (error) {
      console.error("Error updating user role:", error);
      toast.error("Failed to update user role");
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case "active":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" /> Active</Badge>;
      case "suspended":
        return <Badge className="bg-yellow-500"><Ban className="mr-1 h-3 w-3" /> Suspended</Badge>;
      case "banned":
        return <Badge className="bg-red-500"><UserX className="mr-1 h-3 w-3" /> Banned</Badge>;
      default:
        return <Badge>{status || 'Unknown'}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Users</h1>
        <Button onClick={fetchUsers} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Team Size</TableHead>
              <TableHead>Total Income</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name || 'No Name'}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <Badge className={user.isAdmin ? "bg-purple-500" : "bg-blue-500"}>
                    <Star className={`mr-1 h-3 w-3 ${user.isAdmin ? "fill-current" : ""}`} />
                    {user.isAdmin ? "Admin" : "User"}
                  </Badge>
                </TableCell>
                <TableCell>{getStatusBadge(user.status)}</TableCell>
                <TableCell>{user.totalTeamSize || 0}</TableCell>
                <TableCell>
                  {formatCurrency(
                    (user.levelIncome || 0) + 
                    (user.sponsorIncome || 0) + 
                    (user.profitShare || 0)
                  )}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        {actionLoading === user.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <MoreHorizontal className="h-4 w-4" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleRoleChange(user.id, !user.isAdmin)}
                        disabled={actionLoading === user.id}
                      >
                        {user.isAdmin ? "Remove Admin" : "Make Admin"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(user.id, "active")}
                        disabled={actionLoading === user.id || user.status === "active"}
                      >
                        Activate User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(user.id, "suspended")}
                        disabled={actionLoading === user.id || user.status === "suspended"}
                      >
                        Suspend User
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleStatusChange(user.id, "banned")}
                        disabled={actionLoading === user.id || user.status === "banned"}
                        className="text-red-600"
                      >
                        Ban User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
