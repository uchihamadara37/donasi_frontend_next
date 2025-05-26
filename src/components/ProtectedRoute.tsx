"use client";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

type Props = {
  children: React.ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/sign-in"); // arahkan ke halaman login
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="p-4">Checking authentication...</div>;
  }

  if (!user) {
    return null; // sementara kosong, karena udah di-redirect
  }

  return <>{children}</>;
}
