"use client";

import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/web/components/Breadcrumbs";

const pathToBreadcrumb: Record<string, { label: string; href?: string }[]> = {
  "/settings": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
  ],
  "/settings/teams": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
    { label: "Teams", href: "/settings/teams" },
  ],
  "/settings/api-keys": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
    { label: "API Keys", href: "/settings/api-keys" },
  ],
  "/settings/public-api": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
    { label: "Public API Keys", href: "/settings/public-api" },
  ],
  "/settings/audit": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/settings" },
    { label: "AI Audit Logs", href: "/settings/audit" },
  ],
};

function getBreadcrumbItems(pathname: string) {
  const items =
    pathToBreadcrumb[pathname] ?? [
      { label: "Dashboard", href: "/dashboard" },
      { label: "Settings", href: "/settings" },
    ];
  return items.map((item, i) =>
    i === items.length - 1 ? { ...item, href: undefined } : item
  );
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const breadcrumbItems = getBreadcrumbItems(pathname);

  return (
    <>
      <div className="mx-auto max-w-4xl px-4 pt-8 pb-2">
        <Breadcrumbs items={breadcrumbItems} />
      </div>
      {children}
    </>
  );
}
