import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWalletByUserId,
  updateWallet,
  createWithdrawalRequest,
  getWithdrawalRequestsByUserId
} from "@/services/firebaseService";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Wallet, WithdrawalRequest } from "@/types";
import {
  ArrowUpFromLine,
  ArrowRight,
  IndianRupee,
  Clock,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

const formSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => !Number.isNaN(Number(value)), {
      message: "Amount must be a valid number",
    })
    .refine((value) => Number(value) >= 100, {
      message: "Minimum withdrawal amount is ₹100",
    }),
  accountName: z.string().min(2, "Account name is required"),
  accountNumber: z
    .string()
    .min(8, "Account number is required")
    .max(18, "Account number is too long")
    .regex(/^\d+$/, "Account number must contain only digits"),
  ifscCode: z
    .string()
    .min(11, "IFSC code is required")
    .max(11, "IFSC code must be 11 characters")
    .regex(/^[A-Z]{4}0[A-Z0-9]{6}$/, "Invalid IFSC code format"),
  bankName: z.string().min(2, "Bank name is required"),
});

const Withdraw = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
      accountName: "",
      accountNumber: "",
      ifscCode: "",
      bankName: "",
    },
  });

  // Fetch wallet and withdrawal requests
  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser) return;

      try {
        setIsDataLoading(true);
        // Get wallet data
        const walletData = await getWalletByUserId(currentUser.uid);
        setWallet(walletData);

        // Get withdrawal requests
        const requests = await getWithdrawalRequestsByUserId(currentUser.uid);
        setWithdrawalRequests(requests);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load your wallet data");
      } finally {
        setIsDataLoading(false);
      }
    };

    fetchData();
  }, [currentUser]);

  const { register, handleSubmit } = form;

  const onSubmit = handleSubmit(async (data) => {
    setIsLoading(true);

    try {
      if (!currentUser || !wallet || !userProfile) {
        throw new Error("User data not available");
      }

      const amount = Number(data.amount);

      if (amount > wallet.balance) {
        toast.error("Insufficient balance");
        return;
      }

      if (amount < 100) {
        toast.error("Minimum withdrawal amount is ₹100");
        return;
      }

      // Create withdrawal request
      const requestId = await createWithdrawalRequest({
        userId: currentUser.uid,
        userName: userProfile.name,
        userEmail: userProfile.email,
        amount,
        accountDetails: {
          accountName: data.accountName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          bankName: data.bankName,
        },
      });

      // Update wallet balance
      await updateWallet(currentUser.uid, -amount);

      toast.success("Withdrawal request submitted successfully");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting withdrawal request:", error);
      toast.error("Failed to submit withdrawal request");
    } finally {
      setIsLoading(false);
    }
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-yellow-500"><Clock className="mr-1 h-3 w-3" /> Pending</Badge>;
      case "approved":
        return <Badge className="bg-green-500"><CheckCircle className="mr-1 h-3 w-3" /> Approved</Badge>;
      case "rejected":
        return <Badge className="bg-red-500"><AlertCircle className="mr-1 h-3 w-3" /> Rejected</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-4 p-4 md:p-6">
      <Tabs defaultValue="withdraw">
        <TabsList className="w-full">
          <TabsTrigger value="withdraw" className="flex-1">Withdraw</TabsTrigger>
          <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
        </TabsList>

        <TabsContent value="withdraw" className="mt-4">
          <Card>
            <CardHeader>
              <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ArrowUpFromLine className="h-6 w-6 text-primary" />
              </div>
              <CardTitle className="text-center text-xl">Withdraw Funds</CardTitle>
              <CardDescription className="text-center">
                Withdraw your earnings to your bank account
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isDataLoading && (
                <div className="mb-6 rounded-lg border bg-muted/30 p-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">
                      Available Balance
                    </div>
                    <div className="text-2xl font-bold">
                      {wallet ? formatCurrency(wallet.balance) : "₹0.00"}
                    </div>
                  </div>
                </div>
              )}

              <Form {...form}>
                <form onSubmit={onSubmit} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <div className="relative">
                          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <IndianRupee className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <FormControl>
                            <Input
                              placeholder="100"
                              className="pl-9"
                              type="number"
                              min="100"
                              step="100"
                              {...field}
                            />
                          </FormControl>
                        </div>
                        <FormDescription>
                          Minimum withdrawal amount is ₹100
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div>
                      <h3 className="mb-2 font-medium">Bank Account Details</h3>
                      <div className="space-y-4 rounded-lg border p-4">
                        <FormField
                          control={form.control}
                          name="accountName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Holder Name</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="accountNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Account Number</FormLabel>
                              <FormControl>
                                <Input placeholder="12345678901234" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="ifscCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>IFSC Code</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="ABCD0123456"
                                  {...field}
                                  onChange={(e) => {
                                    // Convert to uppercase
                                    field.onChange(e.target.value.toUpperCase());
                                  }}
                                />
                              </FormControl>
                              <FormDescription>
                                Example: SBIN0123456
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="bankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank Name</FormLabel>
                              <FormControl>
                                <Input placeholder="State Bank of India" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading || isDataLoading || (wallet?.balance ?? 0) < 100}
                    >
                      {isLoading ? "Processing..." : "Submit Withdrawal Request"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>

                    {(wallet?.balance ?? 0) < 100 && (
                      <p className="text-center text-sm text-red-500">
                        Insufficient balance. Minimum withdrawal amount is ₹100.
                      </p>
                    )}
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Withdrawal History</CardTitle>
              <CardDescription>
                Track the status of your withdrawal requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isDataLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                </div>
              ) : withdrawalRequests.length > 0 ? (
                <div className="space-y-4">
                  {withdrawalRequests.map((request) => (
                    <div
                      key={request.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <div className="mb-1 font-medium">
                            {formatCurrency(request.amount)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(request.createdAt).toLocaleDateString()}{' '}
                            {new Date(request.createdAt).toLocaleTimeString()}
                          </div>
                          <div className="mt-2 text-sm">
                            Account: {request.accountDetails.accountName} -
                            {request.accountDetails.accountNumber.slice(-4).padStart(request.accountDetails.accountNumber.length, '*')}
                          </div>
                        </div>
                        <div>
                          {getStatusBadge(request.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed text-center">
                  <p className="font-medium">No withdrawal requests</p>
                  <p className="text-sm text-muted-foreground">
                    You haven't made any withdrawal requests yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Withdraw;
