"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  ChevronLeft, 
  AlertCircle,
  MessageSquare,
  CheckSquare,
  Loader2,
  User,
  ArrowUpRight
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";

interface PendingReservation {
  id: string;
  propertyId: string;
  property: { 
    name: string;
    reservationAutoApprovalRules: any;
  };
  guestId: string | null;
  guest: { name: string; email: string | null } | null;
  checkIn: string;
  checkOut: string;
  totalPrice: number | null;
  status: string;
  channel: string | null;
  reviewReason: string;
  createdAt: string;
}

export default function PendingApprovalsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reservations, setReservations] = useState<PendingReservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [approvalNote, setApprovalNote] = useState("");

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tourism/reservations/pending");
      const data = await res.json();
      if (res.ok) {
        setReservations(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.error || "Napaka pri nalaganju čakalne vrste");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchPending();
    }
  }, [status, fetchPending]);

  const handleAction = async (action: "approve" | "reject" | "escalate", ids: string[]) => {
    if (ids.length === 0) return;
    
    setActionLoading(action);
    try {
      const res = await fetch("/api/tourism/reservations/pending", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action, 
          reservationIds: ids,
          notes: action === "approve" ? approvalNote : undefined
        }),
      });
      
      if (res.ok) {
        toast.success(`Uspešno: ${action === "approve" ? "Odobreno" : action === "reject" ? "Zavrnjeno" : "Eskalirano"}`);
        setSelectedIds([]);
        setApprovalNote("");
        fetchPending();
      } else {
        toast.error("Napaka pri izvajanju akcije");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setActionLoading(null);
    }
  };

  if (status === "loading") return null;

  const isDirector = session?.user?.role === "director" || session?.user?.role === "admin";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => router.push("/reservations")}
              className="p-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl hover:bg-gray-50 transition-colors"
              title="Nazaj na rezervacije"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">HITL Queue: Čakajoče odobritve</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                Ročni pregled rezervacij, ki niso izpolnile pogojev za avtomatsko potrditev.
              </p>
            </div>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-2xl border border-blue-100 dark:border-blue-800 animate-in fade-in slide-in-from-top-2">
              <span className="text-xs font-bold text-blue-600 px-3">{selectedIds.length} izbranih</span>
              <button 
                onClick={() => handleAction("approve", selectedIds)}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700"
              >
                {actionLoading === "approve" ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                Batch Approve
              </button>
              <button 
                onClick={() => handleAction("reject", selectedIds)}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700"
              >
                <XCircle className="w-3 h-3" />
                Zavrni
              </button>
            </div>
          )}
        </div>

        {/* Note field toggle */}
        {selectedIds.length > 0 && (
          <div className="mb-6 bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-start gap-4 animate-in fade-in">
            <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
              <MessageSquare className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold mb-2">Dodaj opombo ob odobritvi (opcijsko)</p>
              <textarea 
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500 min-h-[60px]"
                placeholder="Npr. Odobreno po telefonskem dogovoru..."
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">
                    <input 
                      type="checkbox" 
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      title="Izberi vse rezervacije"
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds(reservations.map(r => r.id));
                        else setSelectedIds([]);
                      }}
                      checked={selectedIds.length === reservations.length && reservations.length > 0}
                    />
                  </th>
                  <th className="px-6 py-4 font-medium">Gost / Nastanitev</th>
                  <th className="px-6 py-4 font-medium">Termin</th>
                  <th className="px-6 py-4 font-medium">Razlog za pregled</th>
                  <th className="px-6 py-4 font-medium text-right">Znesek</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-8 h-16 bg-gray-50/50 dark:bg-gray-800/20"></td>
                    </tr>
                  ))
                ) : reservations.length > 0 ? (
                  reservations.map((res) => (
                    <tr key={res.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors ${selectedIds.includes(res.id) ? "bg-blue-50/30 dark:bg-blue-900/10" : ""}`}>
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          title={`Izberi rezervacijo ${res.id}`}
                          checked={selectedIds.includes(res.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds([...selectedIds, res.id]);
                            else setSelectedIds(selectedIds.filter(id => id !== res.id));
                          }}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 text-xs font-bold">
                            {res.guest?.name.charAt(0) ?? "?"}
                          </div>
                          <div>
                            <p className="text-sm font-semibold">{res.guest?.name ?? "Neznan gost"}</p>
                            <p className="text-xs text-gray-400">{res.property.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm">
                          <p className="font-medium">{format(parseISO(res.checkIn), "d. MMM")} - {format(parseISO(res.checkOut), "d. MMM")}</p>
                          <p className="text-xs text-gray-400 capitalize">{res.channel}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg w-fit">
                          <AlertCircle className="w-3.5 h-3.5" />
                          {res.reviewReason}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <p className="text-sm font-bold">€{res.totalPrice?.toLocaleString("sl-SI")}</p>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleAction("approve", [res.id])}
                            title="Odobri"
                            className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleAction("escalate", [res.id])}
                            title="Eskaliraj direktorju"
                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => router.push(`/reservations/${res.id}`)}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg transition-colors"
                            title="Odpri rezervacijo"
                          >
                            <ArrowUpRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckSquare className="w-8 h-8 text-green-500" />
                      </div>
                      <h3 className="font-bold text-lg">Čakalna vrsta je prazna</h3>
                      <p className="text-gray-500 mt-1">Vse rezervacije so bile pregledane ali avtomatsko potrjene.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Role Notice */}
        <div className="mt-8 p-4 bg-gray-100 dark:bg-gray-800/50 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-400" />
            <span className="text-sm text-gray-500">Prijavljeni ste kot: <strong className="text-gray-700 dark:text-gray-300 capitalize">{session?.user?.role || "receptor"}</strong></span>
          </div>
          {isDirector && (
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
              Popoln dostop (Direktor)
            </span>
          )}
        </div>

      </div>
    </div>
  );
}
