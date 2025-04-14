import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Copy, CheckCircle } from "lucide-react";

const profileFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address").optional(),
  phone: z
    .string()
    .min(10, "Phone number must be at least 10 digits")
    .max(15, "Phone number must be at most 15 digits")
    .regex(/^\d+$/, "Phone number must contain only digits")
    .optional(),
  address: z.string().optional(),
  bankDetails: z.object({
    accountName: z.string().min(2, "Account name must be at least 2 characters"),
    accountNumber: z.string().min(8, "Account number must be at least 8 digits").regex(/^\d+$/, "Account number must contain only digits"),
    ifscCode: z.string().min(11, "IFSC code must be 11 characters").max(11, "IFSC code must be 11 characters"),
    bankName: z.string().min(2, "Bank name must be at least 2 characters"),
  }).optional(),
});

const passwordFormSchema = z
  .object({
    currentPassword: z.string().min(6, "Password must be at least 6 characters"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const Profile = () => {
  const { userProfile, logout, updateUserProfile, updateProfilePicture } = useAuth();
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isProfileUpdating, setIsProfileUpdating] = useState(false);
  const [isPasswordUpdating, setIsPasswordUpdating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showBankDetails, setShowBankDetails] = useState(false);

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: userProfile?.name || "",
      email: userProfile?.email || "",
      phone: userProfile?.phone || "",
      address: userProfile?.address || "",
      bankDetails: {
        accountName: userProfile?.bankDetails?.accountName || "",
        accountNumber: userProfile?.bankDetails?.accountNumber || "",
        ifscCode: userProfile?.bankDetails?.ifscCode || "",
        bankName: userProfile?.bankDetails?.bankName || "",
      },
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onProfileSubmit = async (data: z.infer<typeof profileFormSchema>) => {
    setIsProfileUpdating(true);
    try {
      await updateUserProfile(data);
      toast.success("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsProfileUpdating(false);
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordFormSchema>) => {
    setIsPasswordUpdating(true);
    try {
      // In a real application, you would call a function to change the password
      // For now, let's just simulate a successful password change
      await new Promise((resolve) => setTimeout(resolve, 500));
      toast.success("Password changed successfully");
      passwordForm.reset();
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error("Failed to change password");
    } finally {
      setIsPasswordUpdating(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out");
    }
  };

  const copyReferralLink = () => {
    if (!userProfile) return;

    const link = `${window.location.origin}/register?ref=${userProfile.referralId}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!userProfile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 md:p-6">
      <div className="flex flex-col items-center justify-center space-y-2">
        <div className="relative">
          <Avatar className="h-24 w-24">
            <AvatarImage src={userProfile.photoURL || undefined} alt={userProfile.name || "User"} />
            <AvatarFallback className="text-xl">
              {userProfile.name
                ? userProfile.name.charAt(0).toUpperCase()
                : "U"}
            </AvatarFallback>
          </Avatar>
          {isUploadingImage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;

              try {
                setIsUploadingImage(true);
                await updateProfilePicture(file);
                toast.success("Profile picture updated successfully");
              } catch (error) {
                toast.error("Failed to update profile picture");
                console.error(error);
              } finally {
                setIsUploadingImage(false);
              }
            }}
            className="hidden"
            id="profile-picture-input"
            disabled={isUploadingImage}
          />
          <Button
            variant="outline"
            onClick={() => document.getElementById("profile-picture-input")?.click()}
            disabled={isUploadingImage}
          >
            Change Picture
          </Button>
        </div>
        <h1 className="text-2xl font-bold">{userProfile.name}</h1>
        <p className="text-muted-foreground">{userProfile.email}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Referral ID</CardTitle>
          <CardDescription>
            Share this referral ID with others to earn commissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border bg-muted/20 p-3">
            <div className="mb-1 text-sm text-muted-foreground">Referral ID</div>
            <div className="flex items-center justify-between">
              <div className="font-medium">{userProfile.referralId}</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyReferralLink}
                className="gap-1"
              >
                {copied ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-green-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Referral Link:</span>{" "}
            <span className="break-all">
              {window.location.origin}/register?ref={userProfile.referralId}
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList className="w-full">
          <TabsTrigger value="profile" className="flex-1">Profile</TabsTrigger>
          <TabsTrigger value="password" className="flex-1">Password</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your account details here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            disabled
                            type="email"
                          />
                        </FormControl>
                        <FormDescription>
                          Email cannot be changed
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input {...field} type="tel" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={profileForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Bank Details</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBankDetails(!showBankDetails)}
                      >
                        {showBankDetails ? "Hide" : "Show"} Bank Details
                      </Button>
                    </div>

                    <div className={showBankDetails ? "" : "hidden"}>
                      <FormField
                        control={profileForm.control}
                        name="bankDetails.accountName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Name</FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="bankDetails.accountNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Account Number</FormLabel>
                            <FormControl>
                              <Input {...field} type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={profileForm.control}
                        name="bankDetails.ifscCode"
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
                        control={profileForm.control}
                        name="bankDetails.bankName"
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
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isProfileUpdating}>
                      {isProfileUpdating ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end">
                    <Button type="submit" disabled={isPasswordUpdating}>
                      {isPasswordUpdating ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <Button variant="outline" className="w-full max-w-md" onClick={handleLogout}>
          <User className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

export default Profile;
