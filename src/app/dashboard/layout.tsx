"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/web/components/Breadcrumbs";

type SidebarItem = {
  icon: string;
  label: string;
  href: string;
};

const sidebarItems: SidebarItem[] = [
  { icon: "📊", label: "Overview", href: "/dashboard" },
  { icon: "🔄", label: "Workflows", href: "/dashboard/workflows" },
  { icon: "💬", label: "Chat", href: "/dashboard/chat" },
  { icon: "⚙️", label: "Settings", href: "/dashboard/settings" },
];

const tourismNavItems: { name: string; href: string; disabled?: boolean }[] = [
  { name: "Overview", href: "/dashboard/tourism" },
  { name: "Generate", href: "/dashboard/tourism/generate" },
  { name: "Templates", href: "/dashboard/tourism/templates" },
  { name: "Nastanitve", href: "/dashboard/tourism/properties" },
  { name: "Landing Page", href: "/dashboard/tourism/landing" },
  { name: "Email", href: "/dashboard/tourism/email" },
  { name: "SEO", href: "/dashboard/tourism/seo" },
  { name: "Multi-Language", href: "/dashboard/tourism/translate" },
];

const pathToBreadcrumb: Record<string, { label: string; href?: string }[]> = {
  "/dashboard": [{ label: "Dashboard", href: "/dashboard" }],
  "/dashboard/workflows": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Workflows", href: "/dashboard/workflows" },
  ],
  "/dashboard/chat": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Chat", href: "/dashboard/chat" },
  ],
  "/dashboard/tourism": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tourism Hub", href: "/dashboard/tourism" },
  ],
  "/dashboard/tourism/generate": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tourism Hub", href: "/dashboard/tourism" },
    { label: "Generate", href: "/dashboard/tourism/generate" },
  ],
  "/dashboard/tourism/templates": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tourism Hub", href: "/dashboard/tourism" },
    { label: "Templates", href: "/dashboard/tourism/templates" },
  ],
  "/dashboard/tourism/landing": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tourism Hub", href: "/dashboard/tourism" },
    { label: "Landing Page", href: "/dashboard/tourism/landing" },
  ],
  "/dashboard/tourism/email": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tourism Hub", href: "/dashboard/tourism" },
    { label: "Email", href: "/dashboard/tourism/email" },
  ],
  "/dashboard/tourism/seo": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tourism Hub", href: "/dashboard/tourism" },
    { label: "SEO", href: "/dashboard/tourism/seo" },
  ],
  "/dashboard/tourism/properties": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tourism Hub", href: "/dashboard/tourism" },
    { label: "Nastanitve", href: "/dashboard/tourism/properties" },
  ],
  "/dashboard/tourism/translate": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Tourism Hub", href: "/dashboard/tourism" },
    { label: "Multi-Language", href: "/dashboard/tourism/translate" },
  ],
  "/dashboard/settings": [
    { label: "Dashboard", href: "/dashboard" },
    { label: "Settings", href: "/dashboard/settings" },
  ],
};

function getBreadcrumbItems(pathname: string) {
  const items =
    pathToBreadcrumb[pathname] ?? [{ label: "Dashboard", href: "/dashboard" }];
  if (items.length <= 1) return items;
  return items.map((item, i) =>
    i === items.length - 1 ? { ...item, href: undefined } : item
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const breadcrumbItems = getBreadcrumbItems(pathname);
  const [userIndustry, setUserIndustry] = useState<string | null>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    fetch("/api/profile", { signal: ctrl.signal })
      .then((r) => r.json())
      .then((data: { onboarding?: { industry?: string } }) => {
        setUserIndustry(data?.onboarding?.industry ?? null);
      })
      .catch(() => setUserIndustry(null))
      .finally(() => clearTimeout(t));
  }, []);

  const showTourismHub =
    userIndustry === "tourism" || userIndustry === "travel-agency";

  const itemsBeforeTourism = sidebarItems.filter(
    (item) => item.href !== "/dashboard/settings"
  );
  const itemsAfterTourism = sidebarItems.filter(
    (item) => item.href === "/dashboard/settings"
  );

  return (
    <div className="flex min-h-screen">
      <aside className="w-60 shrink-0 border-r border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
        <nav className="p-4 space-y-1" aria-label="Dashboard navigation">
          {itemsBeforeTourism.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}

          {showTourismHub && (
            <div className="space-y-1 pt-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Tourism Hub
              </div>
              {tourismNavItems.map((item) =>
                item.disabled ? (
                  <span
                    key={item.href}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors opacity-50 cursor-not-allowed text-gray-600 dark:text-gray-400`}
                  >
                    {item.name}{" "}
                    <span className="text-xs">(kmalu)</span>
                  </span>
                ) : (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block px-4 py-2 text-sm rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${pathname.startsWith(item.href)
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                  >
                    {item.name}
                  </Link>
                )
              )}
            </div>
          )}

          {itemsAfterTourism.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 ${isActive
                  ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
              >
                <span className="text-lg" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 overflow-auto p-4">
        <Breadcrumbs items={breadcrumbItems} />
        {children}
      </main>
    </div>
  );
}
