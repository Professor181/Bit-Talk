"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, signInOrRegisterWithEmail } from "@/context/AuthContext";
import toast from "react-hot-toast";

type Step = "choose" | "email" | "otp" | "name";

export default function LoginPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [isNewUser, setIsNewUser] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [user, loading, router]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // ── Google Sign-in ──────────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setSubmitting(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (err: any) {
      toast.error(err.message || "Google sign-in failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Send OTP ─────────────────────────────────────────────────
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      setIsNewUser(data.isNewUser);
      setStep("otp");
      setResendCooldown(60);
      toast.success("OTP sent to your email!");
    } catch (err: any) {
      toast.error(err.message || "Failed to send OTP");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Verify OTP ───────────────────────────────────────────────
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid OTP");

      if (isNewUser) {
        setStep("name");
      } else {
        // Sign in existing user
        await signInOrRegisterWithEmail(email);
        router.replace("/");
      }
    } catch (err: any) {
      toast.error(err.message || "OTP verification failed");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Set display name for new users ──────────────────────────
  const handleSetName = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setSubmitting(true);
    try {
      await signInOrRegisterWithEmail(email, displayName.trim());
      router.replace("/");
    } catch (err: any) {
      toast.error(err.message || "Sign-up failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-teal">
        <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-chatBg px-4">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-brand-green rounded-full mb-4 shadow-2xl">
            <svg viewBox="0 0 24 24" className="w-11 h-11 fill-white">
              <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2.546 20.7a1 1 0 001.282 1.282l3.532-.892A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.956 7.956 0 01-4.146-1.163l-.298-.18-2.1.53.53-2.1-.18-.298A7.956 7.956 0 014 12c0-4.411 3.589-8 8-8s8 3.589 8 8-3.589 8-8 8zm4.29-5.71c-.236-.118-1.39-.687-1.605-.764-.216-.078-.373-.118-.53.118-.157.236-.608.764-.745.92-.137.157-.275.177-.51.059-.236-.118-.996-.367-1.897-1.17-.7-.624-1.173-1.395-1.31-1.63-.137-.236-.014-.363.103-.48.106-.106.236-.275.354-.412.118-.137.157-.236.236-.393.078-.157.039-.295-.02-.412-.059-.118-.53-1.28-.726-1.752-.192-.46-.386-.397-.53-.404l-.452-.008c-.157 0-.412.059-.628.295-.216.236-.824.805-.824 1.963 0 1.157.844 2.275.961 2.432.118.157 1.661 2.539 4.026 3.56.563.243 1.003.388 1.345.496.565.18 1.08.155 1.486.094.453-.068 1.39-.568 1.586-1.118.196-.55.196-1.022.137-1.12-.058-.099-.216-.157-.452-.275z"/>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-brand-text">ChatApp</h1>
          <p className="text-brand-subtext mt-1">Real-time messaging, simplified</p>
        </div>

        {/* Card */}
        <div className="bg-brand-sidebar rounded-2xl shadow-2xl border border-brand-sidebarBorder p-8">
          {/* ── Step: Choose method ── */}
          {step === "choose" && (
            <div className="space-y-4 animate-fade-in">
              <h2 className="text-xl font-semibold text-center text-brand-text mb-6">
                Sign in to continue
              </h2>

              {/* Google */}
              <button
                onClick={handleGoogleSignIn}
                disabled={submitting}
                className="w-full flex items-center justify-center gap-3 bg-white text-gray-800 font-semibold py-3 px-4 rounded-xl hover:bg-gray-100 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-md"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-brand-sidebarBorder" />
                <span className="text-brand-subtext text-sm">or</span>
                <div className="flex-1 h-px bg-brand-sidebarBorder" />
              </div>

              {/* Email OTP */}
              <button
                onClick={() => setStep("email")}
                className="w-full flex items-center justify-center gap-3 bg-brand-sidebarHover text-brand-text font-semibold py-3 px-4 rounded-xl hover:bg-opacity-80 transition-all duration-200 border border-brand-sidebarBorder"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Continue with Email OTP
              </button>

              <p className="text-xs text-brand-subtext text-center mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          )}

          {/* ── Step: Enter email ── */}
          {step === "email" && (
            <form onSubmit={handleSendOtp} className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-4">
                <button type="button" onClick={() => setStep("choose")} className="text-brand-subtext hover:text-brand-text transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-brand-text">Enter your email</h2>
              </div>

              <div>
                <label className="block text-sm text-brand-subtext mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-brand-sidebarHover border border-brand-sidebarBorder rounded-xl px-4 py-3 text-brand-text placeholder-brand-subtext focus:outline-none focus:border-brand-green transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !email.trim()}
                className="w-full bg-brand-green hover:bg-brand-darkGreen text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Sending OTP...
                  </span>
                ) : "Send OTP"}
              </button>
            </form>
          )}

          {/* ── Step: Enter OTP ── */}
          {step === "otp" && (
            <form onSubmit={handleVerifyOtp} className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-2 mb-2">
                <button type="button" onClick={() => setStep("email")} className="text-brand-subtext hover:text-brand-text transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
                  </svg>
                </button>
                <h2 className="text-xl font-semibold text-brand-text">Verify OTP</h2>
              </div>
              <p className="text-brand-subtext text-sm">
                We sent a 6-digit code to <span className="text-brand-text font-medium">{email}</span>
              </p>

              <div>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="w-full bg-brand-sidebarHover border border-brand-sidebarBorder rounded-xl px-4 py-3 text-brand-text text-2xl tracking-[0.5em] text-center placeholder-brand-subtext focus:outline-none focus:border-brand-green transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="w-full bg-brand-green hover:bg-brand-darkGreen text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </span>
                ) : "Verify OTP"}
              </button>

              <div className="text-center">
                {resendCooldown > 0 ? (
                  <p className="text-brand-subtext text-sm">Resend OTP in {resendCooldown}s</p>
                ) : (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    className="text-brand-green text-sm hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>
            </form>
          )}

          {/* ── Step: Set display name ── */}
          {step === "name" && (
            <form onSubmit={handleSetName} className="space-y-5 animate-fade-in">
              <h2 className="text-xl font-semibold text-brand-text mb-2">What&apos;s your name?</h2>
              <p className="text-brand-subtext text-sm">This will be displayed to other users</p>

              <div>
                <label className="block text-sm text-brand-subtext mb-1.5">Display name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  required
                  className="w-full bg-brand-sidebarHover border border-brand-sidebarBorder rounded-xl px-4 py-3 text-brand-text placeholder-brand-subtext focus:outline-none focus:border-brand-green transition-colors"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !displayName.trim()}
                className="w-full bg-brand-green hover:bg-brand-darkGreen text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating account...
                  </span>
                ) : "Get Started"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
