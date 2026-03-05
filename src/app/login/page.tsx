"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function LoginRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    // Preusmeri na /signin z enakimi parametri
    const url = new URL(window.location.href);
    const newPath = url.pathname.replace("/login", "/signin") + url.search + url.hash;
    router.replace(newPath);
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mx-auto mb-4" />
        <p className="text-gray-600">Preusmerjanje na prijavo...</p>
      </div>
    </div>
  );
}
