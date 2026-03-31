"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.css";
import { LogIn, User, Lock, Loader2, Mail, KeyRound, ChevronLeft } from "lucide-react";

type View = "login" | "forgotEmail" | "verifyOtp" | "resetPassword";

export default function LoginPage() {
  const [view, setView] = useState<View>("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        window.location.href = "/";
      } else {
        const data = await response.json();
        setError(data.error || "Invalid username or password");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "request", email }),
      });
      const data = await res.json();
      if (res.ok) {
        setView("verifyOtp");
        setMessage("OTP has been sent to your email.");
      } else {
        setError(data.error || "Failed to send OTP");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reset", email, otp, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setView("login");
        setMessage("Password reset successful. Please sign in.");
        setOtp("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.error || "Failed to reset password");
      }
    } catch (err) {
      setError("Failed to connect to server");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.background}>
        <div className={styles.circle1}></div>
        <div className={styles.circle2}></div>
      </div>
      <div className={styles.glassCard}>
        <div className={styles.header}>
          <div className={styles.logoContainer}>
            <LogIn size={32} className={styles.logoIcon} />
          </div>
          <h1>Innomatrics</h1>
          <p>Client Management Portal</p>
        </div>

        {view === "login" && (
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username">Username</label>
              <div className={styles.inputWrapper}>
                <User size={18} className={styles.inputIcon} />
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  required
                />
              </div>
            </div>

            <div className={styles.inputGroup}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label htmlFor="password">Password</label>
                <button 
                  type="button" 
                  onClick={() => setView("forgotEmail")}
                  className={styles.forgotBtn}
                >
                  Forgot Password?
                </button>
              </div>
              <div className={styles.inputWrapper}>
                <Lock size={18} className={styles.inputIcon} />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>
            </div>

            {error && <div className={styles.errorMessage}>{error}</div>}
            {message && <div className={styles.successMessage}>{message}</div>}

            <button type="submit" className={styles.loginButton} disabled={isLoading}>
              {isLoading ? <Loader2 size={20} className={styles.spinner} /> : "Sign In"}
            </button>
          </form>
        )}

        {view === "forgotEmail" && (
          <div className={styles.form}>
            <button onClick={() => setView("login")} className={styles.backBtn}>
              <ChevronLeft size={16} /> Back to Login
            </button>
            <h3>Reset Password</h3>
            <p className={styles.formHint}>Enter your registered email to receive an OTP.</p>
            <form onSubmit={handleRequestOtp}>
              <div className={styles.inputGroup}>
                <label>Email Address</label>
                <div className={styles.inputWrapper}>
                  <Mail size={18} className={styles.inputIcon} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                  />
                </div>
              </div>
              {error && <div className={styles.errorMessage}>{error}</div>}
              <button type="submit" className={styles.loginButton} disabled={isLoading}>
                {isLoading ? <Loader2 size={20} className={styles.spinner} /> : "Send OTP"}
              </button>
            </form>
          </div>
        )}

        {(view === "verifyOtp" || view === "resetPassword") && (
          <div className={styles.form}>
            <button onClick={() => setView("forgotEmail")} className={styles.backBtn}>
              <ChevronLeft size={16} /> Use Different Email
            </button>
            <h3>Verify OTP & Reset</h3>
            <p className={styles.formHint}>Check your email for the 6-digit code.</p>
            <form onSubmit={handleResetPassword}>
              <div className={styles.inputGroup}>
                <label>Verification Code</label>
                <div className={styles.inputWrapper}>
                  <KeyRound size={18} className={styles.inputIcon} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    maxLength={6}
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>New Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    required
                  />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Confirm New Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={18} className={styles.inputIcon} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                  />
                </div>
              </div>

              {error && <div className={styles.errorMessage}>{error}</div>}
              {message && <div className={styles.successMessage}>{message}</div>}

              <button type="submit" className={styles.loginButton} disabled={isLoading}>
                {isLoading ? <Loader2 size={20} className={styles.spinner} /> : "Update Password"}
              </button>
            </form>
          </div>
        )}

        <div className={styles.footer}>
          <p>&copy; 2024 Innomatrics Technologies</p>
        </div>
      </div>
    </div>
  );
}

