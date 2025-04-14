import { useState, useEffect } from "react";
import { collection, doc, getDoc, Timestamp, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { getAllWithdrawalRequests, updateWithdrawalRequest, updateWallet } from "@/services/firebaseService";
import { createInAppNotification } from "@/services/notificationService";
import { Clock, CheckCircle2, XCircle, IndianRupee } from "lucide-react";
import type { WithdrawalRequest } from "@/types";

export default function WithdrawalRequests() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const { currentUser } = useAuth();

  useEffect(() => {
    fetchWithdrawalRequests();
  }, []);

  const fetchWithdrawalRequests = async () => {
    try {
      setLoading(true);
      const withdrawalRequests = await getAllWithdrawalRequests();
      setRequests(withdrawalRequests);
    } catch (error) {
      console.error("Error fetching withdrawal requests:", error);
      toast.error("Failed to load withdrawal requests");
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = (request: WithdrawalRequest) => {
    setSelectedRequest(request);
    setRemarks("");
    setTransactionId("");
  };

  const processRequest = async (status: "approved" | "rejected") => {
    if (!selectedRequest || !currentUser) return;

    try {
      setIsProcessing(true);

      // Update withdrawal request
      await updateWithdrawalRequest(selectedRequest.id, {
        status,
        processedAt: Timestamp.fromDate(new Date()),
        processedBy: currentUser.uid,
        remarks,
        ...(status === "approved" ? { transactionId } : {}),
      });

      // Create transaction record
      const transactionData = {
        userId: selectedRequest.userId,
        amount: selectedRequest.amount,
        type: "withdrawal",
        status: status === "approved" ? "completed" : "failed",
        description: status === "approved" 
          ? "Withdrawal request approved" 
          : `Withdrawal request rejected. Reason: ${remarks}`,
        createdAt: Timestamp.now(),
        withdrawalRequestId: selectedRequest.id,
      };

      const transactionRef = doc(collection(db, "transactions"));
      await setDoc(transactionRef, {
        ...transactionData,
        id: transactionRef.id
      });

      // Create in-app notification
      await createInAppNotification({
        userId: selectedRequest.userId,
        title: `Withdrawal Request ${status}`,
        message: status === "approved" 
          ? `Your withdrawal request for ${formatCurrency(selectedRequest.amount)} has been approved. Transaction ID: ${transactionId}` 
          : `Your withdrawal request for ${formatCurrency(selectedRequest.amount)} has been rejected. Reason: ${remarks}`,
        type: status === "approved" ? "success" : "error",
      });

      if (status === "approved") {
        // Create a transaction record
        // await addDoc(collection(db, "transactions"), {
        //   userId: selectedRequest.userId,
        //   amount: selectedRequest.amount,
        //   type: "withdrawal",
        //   status: "completed",
        //   description: `Withdrawal processed. Transaction ID: ${transactionId}`,
        //   createdAt: Timestamp.now(),
        //   withdrawalRequestId: selectedRequest.id,
        // });
      } else {
        // If rejected, refund the amount to user's wallet
        const walletRef = doc(db, "wallets", selectedRequest.userId);
        const walletDoc = await getDoc(walletRef);
        
        if (walletDoc.exists()) {
          const walletData = walletDoc.data();
          await updateWallet({
            id: walletDoc.id,
            userId: selectedRequest.userId,
            balance: walletData.balance + selectedRequest.amount,
            totalInvested: walletData.totalInvested || 0,
            totalIncome: walletData.totalIncome || 0,
            levelIncome: walletData.levelIncome || 0,
            sponsorIncome: walletData.sponsorIncome || 0,
            profitShare: walletData.profitShare || 0,
            lastUpdated: Timestamp.fromDate(new Date())
          });

          // Create refund transaction
          // await addDoc(collection(db, "transactions"), {
          //   userId: selectedRequest.userId,
          //   amount: selectedRequest.amount,
          //   type: "refund",
          //   status: "completed",
          //   description: `Withdrawal request rejected. Reason: ${remarks}`,
          //   createdAt: Timestamp.now(),
          //   withdrawalRequestId: selectedRequest.id,
          // });
        }
      }

      toast.success(`Withdrawal request ${status}`);
      setSelectedRequest(null);
      fetchWithdrawalRequests();
    } catch (error) {
      console.error("Error processing withdrawal request:", error);
      toast.error("Failed to process withdrawal request");
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-600 border-yellow-300"><Clock className="w-4 h-4 mr-1" /> Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-green-50 text-green-600 border-green-300"><CheckCircle2 className="w-4 h-4 mr-1" /> Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-600 border-red-300"><XCircle className="w-4 h-4 mr-1" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Withdrawal Requests</h1>
      
      <div className="grid gap-4">
        {requests.map((request) => (
          <Card key={request.id} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {request.userName || "Unknown User"}
                </h3>
                <p className="text-sm text-gray-500">{request.userEmail}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold flex items-center gap-1">
                  <IndianRupee className="w-4 h-4" />
                  {Number(request.amount).toLocaleString()}
                </p>
                {getStatusBadge(request.status)}
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Account Details</p>
                <p className="font-medium">{request.accountDetails.accountName}</p>
                <p>{request.accountDetails.accountNumber}</p>
                <p>{request.accountDetails.ifscCode}</p>
              </div>
              <div className="text-right">
                <p className="text-gray-500">Request Date</p>
                <p>{request.createdAt?.toLocaleString()}</p>
                {request.processedAt && (
                  <>
                    <p className="text-gray-500 mt-2">Processed Date</p>
                    <p>{request.processedAt?.toLocaleString()}</p>
                  </>
                )}
              </div>
            </div>

            {request.status === "pending" && (
              <div className="mt-4 flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => handleProcess(request)}
                >
                  Process Request
                </Button>
              </div>
            )}

            {(request.remarks || request.transactionId) && (
              <div className="mt-4 border-t pt-4">
                {request.transactionId && (
                  <p className="text-sm">
                    <span className="text-gray-500">Transaction ID:</span>{" "}
                    {request.transactionId}
                  </p>
                )}
                {request.remarks && (
                  <p className="text-sm">
                    <span className="text-gray-500">Remarks:</span>{" "}
                    {request.remarks}
                  </p>
                )}
              </div>
            )}
          </Card>
        ))}
      </div>

      <Dialog open={!!selectedRequest} onOpenChange={() => setSelectedRequest(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Withdrawal Request</DialogTitle>
            <DialogDescription>
              Review and process the withdrawal request for {selectedRequest?.userName}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Amount</Label>
              <div className="col-span-3">
                <p className="font-semibold">{formatCurrency(selectedRequest?.amount || 0)}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="transactionId" className="text-right">
                Transaction ID
              </Label>
              <Input
                id="transactionId"
                className="col-span-3"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter bank transaction ID"
              />
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="remarks" className="text-right">
                Remarks
              </Label>
              <Textarea
                id="remarks"
                className="col-span-3"
                value={remarks}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRemarks(e.target.value)}
                placeholder="Add any notes or remarks"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSelectedRequest(null)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => processRequest("rejected")}
              disabled={isProcessing || !remarks}
            >
              Reject
            </Button>
            <Button
              onClick={() => processRequest("approved")}
              disabled={isProcessing || !transactionId}
            >
              Approve
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
