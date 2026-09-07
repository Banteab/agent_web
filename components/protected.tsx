"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "./ui";

export function Protected({ children }: { children: React.ReactNode }) {
  const { ready, token } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (ready && !token) router.replace("/");
  }, [ready, token, router]);

  if (!ready || !token) return <Spinner label="Loading" />;
  return <>{children}</>;
}
