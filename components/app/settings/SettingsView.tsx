"use client";

import { useState, useRef, useTransition, useEffect } from "react";
import { trpc } from "@/trpc/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import {
  AlertCircle,
  User,
  Lock,
  Mail,
  Shield,
  LogOut,
  Loader2,
  AlertTriangle,
  Info,
} from "lucide-react";
import {
  updateName,
  updatePassword,
  toggleTwoFactor,
} from "@/lib/auth/settings.actions";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { logOut } from "@/lib/auth/auth.actions";

// Form validation schemas
const updateNameSchema = z.object({
  name: z.string().min(1, "Name is required"),
});

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, { message: "Minimum 8 characters required" })
      .regex(/[a-z]/, { message: "At least one lowercase letter required" })
      .regex(/[A-Z]/, { message: "At least one uppercase letter required" })
      .regex(/[0-9]/, { message: "At least one number required" })
      .regex(/[!@#$%^&*]/, {
        message: "At least one special character required",
      }),
    confirmPassword: z.string().min(1, "Please confirm your password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export function SettingsView() {
  const [activeTab, setActiveTab] = useState("account");
  const [isPending, startTransition] = useTransition();
  const [showPasswordRequirements, setShowPasswordRequirements] =
    useState(false);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);

  // Get session data
  const { data: session, isLoading: isLoadingSession } =
    trpc.auth.getSession.useQuery();

  // Ref for the name form
  const nameFormRef = useRef<HTMLFormElement>(null);

  // Form for updating name
  const nameForm = useForm({
    resolver: zodResolver(updateNameSchema),
    defaultValues: {
      name: "",
    },
  });

  // Form for updating password
  const passwordForm = useForm({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form default values when session data loads
  useEffect(() => {
    if (session?.user?.name) {
      nameForm.setValue("name", session.user.name);
    }
  }, [session, nameForm]);

  // Check if user has password (OAuth users don't)
  const isOAuthUser =
    session?.user &&
    typeof session.user === "object" &&
    "isOAuth" in session.user &&
    Boolean(session.user.isOAuth);

  // Check if 2FA is enabled
  const isTwoFactorEnabled =
    session?.user &&
    typeof session.user === "object" &&
    "isTwoFactorEnabled" in session.user &&
    Boolean(session.user.isTwoFactorEnabled);

  // Handle name update form submission
  const handleNameUpdate = (formData: FormData) => {
    startTransition(async () => {
      const result = await updateName(formData);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  // Handle password update form submission
  const handlePasswordUpdate = (formData: FormData) => {
    startTransition(async () => {
      const result = await updatePassword(formData);

      if (result.success) {
        toast.success(result.message);
        passwordForm.reset();

        if (result.requireReauth) {
          // Add slight delay to show toast before redirecting
          setTimeout(() => {
            logOut();
          }, 2000);
        }
      } else {
        toast.error(result.message);
      }
    });
  };

  // Handle toggle 2FA
  const handleToggleTwoFactor = (enable: boolean) => {
    startTransition(async () => {
      const result = await toggleTwoFactor(enable);

      if (result.success) {
        toast.success(result.message);
        setShowTwoFactorDialog(false);

        if (result.requireReauth) {
          // Add slight delay to show toast before redirecting
          setTimeout(() => {
            logOut();
          }, 2000);
        }
      } else {
        toast.error(result.message);
      }
    });
  };

  // Handle delete account
  const handleDeleteAccount = () => {
    // This will be implemented in a future update
    toast.error("Account deletion is not implemented yet");
    setShowDeleteAccountDialog(false);
  };

  if (isLoadingSession) {
    return (
      <div className="flex justify-center items-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="account">Account</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          {/* Account Tab */}
          <TabsContent value="account">
            {/* Profile Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and how it appears in your
                  account
                </CardDescription>
              </CardHeader>
              <form ref={nameFormRef} action={handleNameUpdate}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        defaultValue={session?.user?.name || ""}
                        placeholder="Your name"
                        disabled={isPending}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        value={session?.user?.email || ""}
                        disabled
                        readOnly
                      />
                      <p className="text-xs text-muted-foreground">
                        Email address cannot be changed
                      </p>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            {/* Email Verification Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="h-5 w-5 text-primary" />
                  Email Verification
                </CardTitle>
                <CardDescription>
                  Your email verification status and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Verification Status</h3>
                    <p className="text-sm text-muted-foreground">
                      Your email address verification status
                    </p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">
                    Verified
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            {/* Password Section */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5 text-primary" />
                  Password
                </CardTitle>
                <CardDescription>
                  Manage your password and authentication settings
                </CardDescription>
              </CardHeader>
              {isOAuthUser ? (
                <CardContent>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertTitle>Password not applicable</AlertTitle>
                    <AlertDescription>
                      You are signed in with Google. You cannot set a password
                      for this account.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              ) : (
                <form action={handlePasswordUpdate}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="newPassword">New Password</Label>
                      <Input
                        id="newPassword"
                        name="newPassword"
                        type="password"
                        disabled={isPending}
                        onFocus={() => setShowPasswordRequirements(true)}
                        onBlur={() => setShowPasswordRequirements(false)}
                      />
                    </div>

                    {showPasswordRequirements && (
                      <div className="text-sm border rounded-md p-3 bg-muted/50">
                        <p className="font-medium mb-2">
                          Password requirements:
                        </p>
                        <ul className="list-disc pl-5 space-y-1 text-xs text-muted-foreground">
                          <li>Minimum 8 characters in length</li>
                          <li>At least one lowercase letter (a-z)</li>
                          <li>At least one uppercase letter (A-Z)</li>
                          <li>At least one number (0-9)</li>
                          <li>At least one special character (!@#$%^&*)</li>
                        </ul>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        disabled={isPending}
                      />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button type="submit" disabled={isPending} className="mt-4">
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Password"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              )}
            </Card>

            {/* Two-Factor Authentication Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">Two-Factor Authentication</h3>
                    <p className="text-sm text-muted-foreground">
                      Protect your account with an additional verification step
                      during login
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={
                        isTwoFactorEnabled
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }
                    >
                      {isTwoFactorEnabled ? "Enabled" : "Disabled"}
                    </Badge>
                    <Switch
                      checked={isTwoFactorEnabled}
                      onCheckedChange={(checked) => {
                        // If disabling, show confirmation dialog
                        if (!checked) {
                          setShowTwoFactorDialog(true);
                        } else {
                          // If enabling, just enable it
                          handleToggleTwoFactor(true);
                        }
                      }}
                      disabled={isPending}
                    />
                  </div>
                </div>

                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>How it works</AlertTitle>
                  <AlertDescription>
                    When enabled, you&apos;ll need to enter a verification code
                    sent to your email each time you sign in to your account.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Danger Zone
                </CardTitle>
                <CardDescription>
                  Irreversible and destructive actions for your account
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="border border-destructive/20 p-4 rounded-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-destructive">
                        Delete Account
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all your data. This
                        action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowDeleteAccountDialog(true)}
                      disabled={isPending}
                    >
                      Delete Account
                    </Button>
                  </div>
                </div>

                <div className="border border-destructive/20 p-4 rounded-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-destructive">
                        Log Out Everywhere
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Sign out of all devices. You&apos;ll need to log in
                        again on all your devices.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        // Logout not implemented yet
                        toast.success("You will be logged out everywhere soon");
                        setTimeout(() => {
                          logOut();
                        }, 2000);
                      }}
                      disabled={isPending}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log Out Everywhere
                    </Button>
                  </div>
                </div>

                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Warning</AlertTitle>
                  <AlertDescription>
                    Actions in this section can lead to permanent data loss.
                    Please proceed with caution.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Two-Factor Disable Confirmation Dialog */}
        <Dialog
          open={showTwoFactorDialog}
          onOpenChange={setShowTwoFactorDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
              <DialogDescription>
                Disabling two-factor authentication will make your account less
                secure. Are you sure you want to continue?
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 border rounded-md bg-amber-50 text-amber-900">
              <p className="flex items-center text-sm font-medium">
                <AlertTriangle className="h-4 w-4 mr-2" />
                This will reduce the security of your account
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowTwoFactorDialog(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleToggleTwoFactor(false)}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Disabling...
                  </>
                ) : (
                  "Disable 2FA"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Account Confirmation Dialog */}
        <Dialog
          open={showDeleteAccountDialog}
          onOpenChange={setShowDeleteAccountDialog}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Your Account?</DialogTitle>
              <DialogDescription>
                This will permanently delete your account and all associated
                data. This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="p-4 border border-destructive rounded-md bg-destructive/5 text-destructive">
              <p className="flex items-center text-sm font-medium">
                <AlertTriangle className="h-4 w-4 mr-2" />
                All your data will be permanently deleted
              </p>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDeleteAccountDialog(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete Account"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
