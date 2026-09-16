"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { SyntheticEvent, useEffect, useState } from "react";
import { apiRequest, warmUpBackend } from "@/lib/api";
import { clearAuth, saveAuth } from "@/lib/auth";
import type { AuthResponse } from "@/types";
import { buttonClass, Field, inputClass, Notice } from "@/components/ui";
import { AppMark } from "@/components/AppMark";

function destination(role: string) {
  return role === "BORROWER" ? "/borrower" : "/dashboard";
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    warmUpBackend();
  }, []);

  async function handleSubmit(event: SyntheticEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const auth = await apiRequest<AuthResponse>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password })
      });
      clearAuth();
      saveAuth(auth);
      router.replace(destination(auth.user.role));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/70 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-8 sm:p-10 shadow-soft">
          {/* Brand & Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <AppMark />
            <h1 className="mt-5 text-2xl font-extrabold tracking-tight text-slate-900">
              Sign In
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your credentials to access your account
            </p>
          </div>

          {/* Form */}
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && <Notice type="error" message={error} />}

            <Field label="Email Address">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@example.com"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </Field>

            <Field label="Password">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className={`${inputClass} pl-10 pr-10`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>

            <button
              type="submit"
              disabled={loading}
              className={`${buttonClass} w-full py-3 text-sm font-semibold shadow-sm`}
            >
              <LogIn className="mr-2 h-4 w-4" />
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-xs text-slate-500">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-4"
            >
              Create borrower account
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
