import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { SystemSettings } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  sponsorCommissionPercentage: z.string().min(1, "Required").refine(val => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100, "Must be between 0 and 100"),
  profitSharePercentage: z.string().min(1, "Required").refine(val => !isNaN(Number(val)) && Number(val) > 0 && Number(val) <= 100, "Must be between 0 and 100"),
  minDepositAmount: z.string().min(1, "Required").refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Must be a positive number"),
  minWithdrawalAmount: z.string().min(1, "Required").refine(val => !isNaN(Number(val)) && Number(val) >= 0, "Must be a positive number"),
  adminBankDetails: z.object({
    accountName: z.string().min(1, "Required"),
    accountNumber: z.string().min(1, "Required"),
    bankName: z.string().min(1, "Required"),
    ifscCode: z.string().min(1, "Required"),
    upiId: z.string().optional(),
  }),
  levelCommissions: z.array(z.object({
    level: z.number(),
    percentage: z.string().refine(val => !isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 100, "Must be between 0 and 100"),
  })),
});

const SystemSettings = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<SystemSettings | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sponsorCommissionPercentage: "",
      profitSharePercentage: "",
      minDepositAmount: "",
      minWithdrawalAmount: "",
      adminBankDetails: {
        accountName: "",
        accountNumber: "",
        bankName: "",
        ifscCode: "",
        upiId: "",
      },
      levelCommissions: [
        { level: 1, percentage: "" },
        { level: 2, percentage: "" },
        { level: 3, percentage: "" },
      ],
    },
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const settingsRef = doc(db, "settings", "system");
      const settingsDoc = await getDoc(settingsRef);
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as SystemSettings;
        setSettings(data);
        
        // Update form with existing values
        form.reset({
          sponsorCommissionPercentage: data.sponsorCommissionPercentage.toString(),
          profitSharePercentage: data.profitSharePercentage.toString(),
          minDepositAmount: data.minDepositAmount.toString(),
          minWithdrawalAmount: data.minWithdrawalAmount.toString(),
          adminBankDetails: data.adminBankDetails,
          levelCommissions: data.levelCommissions.map(lc => ({
            level: lc.level,
            percentage: lc.percentage.toString(),
          })),
        });
      }
    };

    fetchSettings();
  }, [form]);

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    try {
      const settingsData: SystemSettings = {
        id: "system",
        sponsorCommissionPercentage: Number(data.sponsorCommissionPercentage),
        profitSharePercentage: Number(data.profitSharePercentage),
        minDepositAmount: Number(data.minDepositAmount),
        minWithdrawalAmount: Number(data.minWithdrawalAmount),
        adminBankDetails: data.adminBankDetails,
        levelCommissions: data.levelCommissions.map(lc => ({
          level: lc.level,
          percentage: Number(lc.percentage),
        })),
        lastUpdated: serverTimestamp(),
      };

      await setDoc(doc(db, "settings", "system"), settingsData);
      toast.success("Settings updated successfully");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure system-wide settings and admin bank details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="sponsorCommissionPercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sponsor Commission (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="profitSharePercentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profit Share (%)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minDepositAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Deposit Amount (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="minWithdrawalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Minimum Withdrawal Amount (₹)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Admin Bank Details</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="adminBankDetails.accountName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Holder Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminBankDetails.accountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Number</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminBankDetails.bankName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminBankDetails.ifscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="adminBankDetails.upiId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>UPI ID (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Level Commissions</h3>
                {form.watch("levelCommissions").map((_, index) => (
                  <div key={index} className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name={`levelCommissions.${index}.percentage`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level {index + 1} Commission (%)</FormLabel>
                          <FormControl>
                            <Input type="number" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Settings"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemSettings;
