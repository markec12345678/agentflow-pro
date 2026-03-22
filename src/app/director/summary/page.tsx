"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  Users, 
  ArrowUpRight,
  ShieldCheck,
  Zap
} from "lucide-react";

interface DirectorSummary {
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  autoApprovalRate: number;
  satisfactionScore: number;
  eturizemStatus: "synced" | "pending";
  actionsRequired: Array<{
    id: string;
    type: string;
    title: string;
    count: number;
    severity: "high" | "medium" | "low";
    href: string;
  }>;
  propertyCount: number;
}

export default function DirectorSummaryPage() {
  const { status } = useSession();
  const [data, setData] = useState<DirectorSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      redirect("/login?callbackUrl=/director/summary");
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/director/summary")
        .then(r => r.json())
        .then(setData)
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [status]);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-8 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-full mb-4" />
          <p className="text-gray-500">Priprava direktorjevega pregleda...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Zero-Touch Direktor</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Pregled poslovanja in avtomatizacije v realnem času.</p>
          </div>
          <div className="flex items-center gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors">
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
              <Download className="w-4 h-4" />
              PDF Poročilo
            </button>
          </div>
        </div>

        {/* Top Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          
          {/* Revenue Today */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">Danes</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Prihodki</p>
            <h3 className="text-2xl font-bold mt-1">€{data.revenue.today.toLocaleString("sl-SI")}</h3>
            <div className="flex items-center gap-1 mt-4 text-xs text-gray-400">
              <span className="text-green-500 font-medium">Teden: €{data.revenue.week.toLocaleString("sl-SI")}</span>
            </div>
          </div>

          {/* Auto-Approval Rate */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-full">30 dni</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Stopnja avtomatizacije</p>
            <h3 className="text-2xl font-bold mt-1">{data.autoApprovalRate}%</h3>
            <div className="mt-4 h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${data.autoApprovalRate}%` }} />
            </div>
          </div>

          {/* Guest Satisfaction */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">Rating</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">Zadovoljstvo gostov</p>
            <h3 className="text-2xl font-bold mt-1">{data.satisfactionScore}/5.0</h3>
            <p className="text-xs text-gray-400 mt-4">Na podlagi feedbackov agenta</p>
          </div>

          {/* eTurizem Status */}
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                data.eturizemStatus === "synced" ? "text-green-600 bg-green-50 dark:bg-green-900/20" : "text-amber-600 bg-amber-50 dark:bg-amber-900/20"
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${data.eturizemStatus === "synced" ? "bg-green-500" : "bg-amber-500 animate-pulse"}`} />
                {data.eturizemStatus === "synced" ? "Sinhronizirano" : "V čakanju"}
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">eTurizem status</p>
            <h3 className="text-2xl font-bold mt-1">{data.eturizemStatus === "synced" ? "Brez napak" : "Potrebna akcija"}</h3>
            <p className="text-xs text-gray-400 mt-4">Povezava z AJPES</p>
          </div>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Exceptions / Actions Required */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-50 dark:border-gray-800 flex items-center justify-between">
                <h2 className="font-bold text-lg">Potrebna vaša pozornost</h2>
                <span className="px-2.5 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold rounded-full">
                  {data.actionsRequired.length} IZJEM
                </span>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {data.actionsRequired.length > 0 ? (
                  data.actionsRequired.map((action) => (
                    <Link 
                      key={action.id} 
                      href={action.href}
                      className="flex items-center justify-between p-6 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${
                          action.severity === "high" ? "bg-red-100 text-red-600" : 
                          action.severity === "medium" ? "bg-amber-100 text-amber-600" : "bg-blue-100 text-blue-600"
                        }`}>
                          <AlertCircle className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{action.title}</h4>
                          <p className="text-sm text-gray-500">{action.count} elementov čaka</p>
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
                    </Link>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="font-bold text-lg">Vse teče gladko</h3>
                    <p className="text-gray-500 mt-1">Trenutno ni nobenih izjem, ki bi zahtevale ročno posredovanje.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Revenue Breakdown / Quick Stats */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <h2 className="font-bold mb-6">Mesečni trend prihodkov</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Ta mesec</span>
                  <span className="font-bold">€{data.revenue.month.toLocaleString("sl-SI")}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full">
                  <div className="bg-green-500 h-full rounded-full" style={{ width: "75%" }} />
                </div>
                <p className="text-xs text-gray-400 text-center mt-2">12% več kot prejšnji mesec</p>
              </div>
            </div>

            <div className="bg-linear-to-br from-blue-600 to-indigo-700 p-6 rounded-2xl text-white shadow-lg">
              <h2 className="font-bold text-lg mb-2">Portfolio status</h2>
              <p className="text-blue-100 text-sm mb-6">Upravljate {data.propertyCount} nastanitev.</p>
              <Link 
                href="/dashboard/tourism/properties" 
                className="block w-full text-center py-3 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-bold transition-colors"
              >
                Upravljaj nastanitve
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
