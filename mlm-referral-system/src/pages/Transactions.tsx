import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getTransactionsByUserId } from "@/services/firebaseService";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { DownloadPDFButton } from "@/components/ui/download-pdf-button";
import type { Transaction } from "@/types";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  ArrowDownToLine,
  ArrowUpFromLine,
  Users,
  IndianRupee,
  FileText,
} from "lucide-react";

const Transactions = () => {
  const { currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        setError(null);
        console.log("Fetching transactions for user:", currentUser.uid);
        const data = await getTransactionsByUserId(currentUser.uid);
        console.log("Fetched transactions:", data);
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        // Check if it's an indexing error
        if (error instanceof Error && error.message.includes("requires an index")) {
          const message = "System is being optimized for first use. Please wait a few minutes and try again.";
          toast.error(message, { duration: 10000 });
          setError(message);
        } else {
          const message = "Failed to load transactions. Please try again later.";
          toast.error(message);
          setError(message);
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransactions();
  }, [currentUser]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTransactions(transactions);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = transactions.filter(
      (transaction) =>
        transaction.type.toLowerCase().includes(query) ||
        transaction.status.toLowerCase().includes(query) ||
        transaction.description.toLowerCase().includes(query) ||
        transaction.amount.toString().includes(query)
    );
    setFilteredTransactions(filtered);
  }, [searchQuery, transactions]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" /> Completed</Badge>;
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      case "failed":
        return <Badge className="bg-red-500"><AlertCircle className="mr-1 h-3 w-3" /> Failed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "deposit":
        return <ArrowDownToLine className="h-5 w-5 text-green-500" />;
      case "withdrawal":
        return <ArrowUpFromLine className="h-5 w-5 text-red-500" />;
      case "level_income":
        return <Users className="h-5 w-5 text-blue-500" />;
      case "sponsor_income":
        return <Users className="h-5 w-5 text-purple-500" />;
      case "profit_share":
        return <IndianRupee className="h-5 w-5 text-amber-500" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const getTransactionTypeBadge = (type: string) => {
    switch (type) {
      case "deposit":
        return <Badge variant="outline" className="border-green-500 text-green-700"><ArrowDownToLine className="mr-1 h-3 w-3" /> Deposit</Badge>;
      case "withdrawal":
        return <Badge variant="outline" className="border-red-500 text-red-700"><ArrowUpFromLine className="mr-1 h-3 w-3" /> Withdrawal</Badge>;
      case "level_income":
        return <Badge variant="outline" className="border-blue-500 text-blue-700"><Users className="mr-1 h-3 w-3" /> Level Income</Badge>;
      case "sponsor_income":
        return <Badge variant="outline" className="border-purple-500 text-purple-700"><Users className="mr-1 h-3 w-3" /> Sponsor Income</Badge>;
      case "profit_share":
        return <Badge variant="outline" className="border-amber-500 text-amber-700"><IndianRupee className="mr-1 h-3 w-3" /> Profit Share</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  return (
    <div className="space-y-4 p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                View all your transactions
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {filteredTransactions.length > 0 && (
                <DownloadPDFButton
                  data={filteredTransactions}
                  type="transactions"
                  title="Transaction History"
                  label="Download History"
                />
              )}
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search transactions..."
                  className="pl-9 md:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={contentRef}>
            {isLoading ? (
              <div className="flex h-32 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              </div>
            ) : error ? (
              <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                <h3 className="font-medium">{error}</h3>
              </div>
            ) : filteredTransactions.length > 0 ? (
              <div className="space-y-4">
                {filteredTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
                        {getTransactionIcon(transaction.type)}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          {getTransactionTypeBadge(transaction.type)}
                          {getStatusBadge(transaction.status)}
                        </div>
                        <div className="mt-1 text-sm text-muted-foreground">
                          {transaction.description || "Transaction"}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(transaction.createdAt).toLocaleDateString()}{" "}
                          {new Date(transaction.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-lg font-medium ${
                        transaction.type === "withdrawal"
                          ? "text-red-600"
                          : "text-green-600"
                      }`}>
                        {transaction.type === "withdrawal" ? "-" : "+"}{formatCurrency(transaction.amount)}
                      </div>
                      {transaction.razorpayPaymentId && (
                        <div className="text-xs text-muted-foreground">
                          ID: {transaction.razorpayPaymentId.substring(0, 8)}...
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                <FileText className="mb-2 h-8 w-8 text-muted-foreground" />
                {searchQuery ? (
                  <>
                    <h3 className="font-medium">No transactions found</h3>
                    <p className="text-sm text-muted-foreground">
                      No results match your search query
                    </p>
                  </>
                ) : (
                  <>
                    <h3 className="font-medium">No transactions yet</h3>
                    <p className="text-sm text-muted-foreground">
                      Your transaction history will appear here
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Transactions;
