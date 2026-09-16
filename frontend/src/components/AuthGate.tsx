"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearAuth, getUser } from "@/lib/auth";
import type { Role, User } from "@/types";

import { Loader2 } from "lucide-react";

type AuthGateProps = {
  allow: Role[];
  children: (user: User) => React.ReactNode;
};

export function AuthGate({ allow, children }: AuthGateProps) {
  const router = useRouter();
  const allowedRoles = allow.join("|");
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    function syncUser() {
      const currentUser = getUser();

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (!allowedRoles.split("|").includes(currentUser.role) && currentUser.role !== "ADMIN") {
        router.replace(currentUser.role === "BORROWER" ? "/borrower" : "/dashboard");
        return;
      }

      setUser(currentUser);
      setReady(true);
    }

    syncUser();

    window.addEventListener("storage", syncUser);
    window.addEventListener("lms_auth_changed", syncUser);
    return () => {
      window.removeEventListener("storage", syncUser);
      window.removeEventListener("lms_auth_changed", syncUser);
    };
  }, [allowedRoles, router]);

  if (!ready || !user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" style={{ width: 32, height: 32 }} />
        </div>
      </main>
    );
  }

  return <>{children(user)}</>;
}

export function useLogout() {
  const router = useRouter();

  return () => {
    clearAuth();
    router.replace("/login");
  };
}
