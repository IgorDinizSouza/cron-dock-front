"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isReady } = useAuth();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isReady) return;

    if (!isAuthenticated) {
      sessionStorage.setItem("postLoginRedirect", pathname || "/");
      router.replace("/login");
      return;
    }

    setReady(true);
  }, [isAuthenticated, isReady, pathname, router]);

  if (!ready) return null;
  return <>{children}</>;
}

