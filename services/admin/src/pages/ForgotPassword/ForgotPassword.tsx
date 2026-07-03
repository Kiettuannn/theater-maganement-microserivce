import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  forgotPassword,
  resetPassword,
} from "@/services/authenticationService";
import { useNotificationStore } from "@/stores";
import { ROUTES } from "@/constants/routes";
import { ArrowLeft } from "lucide-react";

export function ForgotPassword() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  const [step, setStep] = useState<"email" | "otp">("email");
  const [loginIdentifier, setLoginIdentifier] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await forgotPassword(loginIdentifier);

      addNotification({
        type: "success",
        title: "OTP Sent",
        message: "Please check your email for the OTP code.",
        duration: 5000,
      });

      setStep("otp");
    } catch (error: any) {
      console.error("Send OTP failed:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to send OTP. Please try again.";
      setError(errorMessage);

      addNotification({
        type: "error",
        title: "Failed to Send OTP",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      await resetPassword(loginIdentifier, otpCode, newPassword);

      addNotification({
        type: "success",
        title: "Password Reset Successful",
        message: "You can now login with your new password.",
        duration: 5000,
      });

      // Redirect to login page after 2 seconds
      setTimeout(() => {
        navigate(ROUTES.LOGIN);
      }, 2000);
    } catch (error: any) {
      console.error("Reset password failed:", error);
      const errorMessage =
        error?.response?.data?.message ||
        "Failed to reset password. Please check your OTP and try again.";
      setError(errorMessage);

      addNotification({
        type: "error",
        title: "Failed to Reset Password",
        message: errorMessage,
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-background to-card p-4">
      <div className="w-full max-w-md">
        <Card className="w-full border-border/50 shadow-2xl">
          <CardHeader className="space-y-2 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xl">
                  🔒
                </span>
              </div>
            </div>
            <CardTitle className="text-2xl">
              {step === "email" ? "Forgot Password" : "Reset Password"}
            </CardTitle>
            <CardDescription>
              {step === "email"
                ? "Enter your email or username to receive an OTP code"
                : "Enter the OTP code sent to your email and your new password"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                {error}
              </div>
            )}

            {step === "email" ? (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Email or Username
                  </label>
                  <Input
                    type="text"
                    placeholder="admin@cinema.com or username"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Sending..." : "Send OTP Code"}
                </Button>

                <div className="text-center">
                  <Link
                    to={ROUTES.LOGIN}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Login
                  </Link>
                </div>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">OTP Code</label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit OTP code"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    required
                    disabled={isLoading}
                    maxLength={6}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Resetting..." : "Reset Password"}
                </Button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep("email");
                      setOtpCode("");
                      setNewPassword("");
                      setConfirmPassword("");
                      setError("");
                    }}
                    className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    disabled={isLoading}
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Email
                  </button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
