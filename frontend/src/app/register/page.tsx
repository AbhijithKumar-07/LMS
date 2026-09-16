"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserPlus, User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { SyntheticEvent, useEffect, useState } from "react";
import { apiRequest, warmUpBackend } from "@/lib/api";
import { clearAuth, saveAuth } from "@/lib/auth";
import type { AuthResponse } from "@/types";
import { buttonClass, Field, inputClass, Notice } from "@/components/ui";
import { AppMark } from "@/components/AppMark";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
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
      const auth = await apiRequest<AuthResponse>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password })
      });
      clearAuth();
      saveAuth(auth);
      router.replace("/borrower");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Registration failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/70 p-4 sm:p-6">
      <div className="w-full max-w-md">
        {/* Card Container */}
        <div className="rounded-3xl border border-slate-200/80 bg-white p-7 sm:p-9 shadow-soft">
          {/* Brand & Header */}
          <div className="mb-5">
            <AppMark />
            <div className="mt-3.5 pt-3.5 border-t border-slate-100">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                Create Borrower Account
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Sign up to submit and track your loan applications
              </p>
            </div>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && <Notice type="error" message={error} />}

            <Field label="Full Legal Name">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <User className="h-4 w-4" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="e.g. John Doe"
                  className={`${inputClass} pl-10`}
                />
              </div>
            </Field>

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

            <Field label="Password" hint="Must be at least 8 characters">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
                  <Lock className="h-4 w-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  minLength={8}
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
              className={`${buttonClass} w-full py-3 text-sm font-semibold shadow-sm mt-2`}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          {/* Footer Link */}
          <div className="mt-5 pt-4 border-t border-slate-100 text-left text-xs text-slate-500">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-brand-600 hover:text-brand-700 underline underline-offset-4"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
