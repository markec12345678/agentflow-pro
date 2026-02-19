"use client";

import { usePathname } from "next/navigation";
import { LandingNav } from "@/web/components/LandingNav";
import { AppNav } from "@/web/components/AppNav";

const PUBLIC_PREFIXES = [
  "/",
  "/pricing",
  "/solutions",
  "/docs",
  "/contact",
  "/login",
  "/register",
  "/onboarding",
  "/stories",
  "/invite",
];

export function Nav() {
  const pathname = usePathname();
  const isPublicPage = PUBLIC_PREFIXES.some((p) =>
    p === "/"
      ? pathname === "/"
      : pathname === p || pathname.startsWith(p + "/")
  );
  return isPublicPage ? <LandingNav /> : <AppNav />;
}
