import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { formatCurrency } from "@/lib/utils";
import { sendTransactionNotifications } from "@/services/notificationService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowDownToLine, ArrowRight, IndianRupee } from "lucide-react";

const formSchema = z.object({
  amount: z
    .string()
    .min(1, "Amount is required")
    .refine((value) => !isNaN(Number(value)), {
      message: "Amount must be a valid number",
    })
    .refine((value) => Number(value) >= 100, {
      message: "Minimum deposit amount is ₹100",
    }),
});

const AddFunds = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    if (!currentUser) {
      toast.error("You must be logged in to add funds");
      return;
    }

    const amount = Number(data.amount);
    setIsLoading(true);

    try {
      // Create transaction record
      const transactionData = {
        userId: currentUser.uid,
        amount,
        type: "deposit",
        status: "completed", // Auto-approve for testing
        description: "Funds added to wallet",
        createdAt: serverTimestamp(),
      };

      const transactionRef = await addDoc(collection(db, "transactions"), transactionData);

      // Send notifications
      await sendTransactionNotifications({
        id: transactionRef.id,
        ...transactionData,
        createdAt: new Date(),
      });

      // Update user's wallet
      const walletRef = doc(db, "wallets", currentUser.uid);
      const walletDoc = await getDoc(walletRef);
      
      if (walletDoc.exists()) {
        const wallet = walletDoc.data();
        await updateDoc(walletRef, {
          balance: (wallet.balance || 0) + amount,
          totalInvested: (wallet.totalInvested || 0) + amount,
        });
      } else {
        // Create wallet if it doesn't exist, using setDoc to ensure correct ID
        await setDoc(walletRef, {
          userId: currentUser.uid,
          balance: amount,
          totalInvested: amount,
          createdAt: serverTimestamp(),
        });
      }

      toast.success(`Successfully added ${formatCurrency(amount)} to your wallet`);
      navigate("/dashboard");
    } catch (error) {
      console.error("Error processing transaction:", error);
      toast.error("Failed to process transaction");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md space-y-8 p-4 md:p-6">
      <Card>
        <CardHeader>
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ArrowDownToLine className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-center text-xl">Add Funds</CardTitle>
          <CardDescription className="text-center">
            Add money to your wallet (Test Mode)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <IndianRupee className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground" />
                        <Input type="number" className="pl-10" {...field} />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Minimum deposit amount: ₹100
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <div className="rounded-lg border p-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-muted-foreground">Amount</div>
                    <div className="text-right font-medium">
                      {form.watch("amount")
                        ? formatCurrency(Number(form.watch("amount")))
                        : "₹0.00"}
                    </div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Processing..." : "Add Funds (Test)"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddFunds;
