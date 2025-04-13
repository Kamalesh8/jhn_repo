import { useState, useEffect, useRef } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Check, X, Filter } from "lucide-react";
import { DownloadPDFButton } from "@/components/ui/download-pdf-button";

interface User {
  name: string;
  email: string;
}

interface Transaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  createdAt: any;
  userName?: string;
  userEmail?: string;
}

type StatusType = "all" | "pending" | "completed" | "rejected";

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusType>("all");
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTransactions();
  }, [statusFilter]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      console.log("Fetching transactions...");

      // Create base query for transactions collection
      const transactionsRef = collection(db, "transactions");
      const q = query(transactionsRef, orderBy("createdAt", "desc"));
      
      const querySnapshot = await getDocs(q);
      console.log(`Found ${querySnapshot.size} transactions`);
      
      const txns: Transaction[] = [];
      
      for (const docSnapshot of querySnapshot.docs) {
        try {
          const data = docSnapshot.data();
          const txn: Transaction = {
            id: docSnapshot.id,
            userId: data.userId,
            amount: data.amount,
            type: data.type || "deposit",
            status: data.status || "pending",
            description: data.description || "",
            createdAt: data.createdAt?.toDate?.() || null,
          };

          // Fetch user details
          try {
            const userDoc = await getDoc(doc(db, "users", txn.userId));
            if (userDoc.exists()) {
              const userData = userDoc.data() as User;
              txn.userName = userData.name;
              txn.userEmail = userData.email;
            } else {
              console.log(`User not found for ID: ${txn.userId}`);
            }
          } catch (userError) {
            console.error("Error fetching user data:", userError);
          }

          // Apply status filter
          if (statusFilter === "all" || txn.status === statusFilter) {
            txns.push(txn);
          }
        } catch (txnError) {
          console.error("Error processing transaction:", txnError);
        }
      }
      
      console.log(`Processed ${txns.length} transactions after filtering`);
      setTransactions(txns);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transaction: Transaction) => {
    try {
      // Update transaction status
      await updateDoc(doc(db, "transactions", transaction.id), {
        status: "completed",
      });

      // Update user's wallet
      const walletRef = doc(db, "wallets", transaction.userId);
      const walletDoc = await getDoc(walletRef);
      
      if (walletDoc.exists()) {
        const wallet = walletDoc.data();
        await updateDoc(walletRef, {
          balance: (wallet.balance || 0) + transaction.amount,
          totalInvested: (wallet.totalInvested || 0) + transaction.amount,
        });
      }

      toast.success("Transaction approved successfully");
      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error("Error approving transaction:", error);
      toast.error("Failed to approve transaction");
    }
  };

  const handleReject = async (transaction: Transaction) => {
    try {
      await updateDoc(doc(db, "transactions", transaction.id), {
        status: "rejected",
      });
      
      toast.success("Transaction rejected");
      fetchTransactions(); // Refresh the list
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      toast.error("Failed to reject transaction");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600";
      case "pending":
        return "text-yellow-600";
      case "rejected":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>Transactions</CardTitle>
            <CardDescription>
              Manage and monitor all transactions
            </CardDescription>
          </div>
          <div className="flex items-center gap-4">
            {transactions.length > 0 && (
              <DownloadPDFButton
                data={transactions}
                type="transactions"
                title="System Transactions Report"
                label="Download Report"
              />
            )}
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select
                value={statusFilter}
                onValueChange={(value: StatusType) => setStatusFilter(value)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent ref={contentRef}>
          <div className="space-y-4">
            {transactions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No transactions found
              </p>
            ) : (
              transactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="space-y-1">
                    <p className="font-medium">
                      {transaction.userName || "Unknown User"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.userEmail}
                    </p>
                    <p className="text-sm">
                      Amount: {formatCurrency(transaction.amount)}
                    </p>
                    <p className="text-sm">
                      Type: {transaction.type}
                    </p>
                    <p className={`text-sm font-medium ${getStatusColor(transaction.status)}`}>
                      Status: {transaction.status}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {transaction.createdAt?.toLocaleString()}
                    </p>
                  </div>
                  {transaction.status === "pending" && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600"
                        onClick={() => handleApprove(transaction)}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-red-600"
                        onClick={() => handleReject(transaction)}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminTransactions;
