"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  ChevronRight, 
  ShieldAlert, 
  Star, 
  Filter,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { toast } from "sonner";

interface Guest {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  riskScore: string | null;
  isVip: boolean;
  gdprConsent: boolean;
  createdAt: string;
}

export default function GuestsPage() {
  const { status } = useSession();
  const router = useRouter();
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchGuests = useCallback(async (query = "") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/tourism/guests${query ? `?q=${query}` : ""}`);
      const data = await res.json();
      if (res.ok) {
        setGuests(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.error || "Napaka pri nalaganju gostov");
      }
    } catch (error) {
      toast.error("Sistemska napaka");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      fetchGuests();
    }
  }, [status, fetchGuests]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.length >= 2 || search.length === 0) {
        fetchGuests(search);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, fetchGuests]);

  const getRiskColor = (score: string | null) => {
    switch (score?.toLowerCase()) {
      case "low": return "text-green-600 bg-green-50 dark:bg-green-900/20";
      case "medium": return "text-amber-600 bg-amber-50 dark:bg-amber-900/20";
      case "high": return "text-red-600 bg-red-50 dark:bg-red-900/20";
      default: return "text-gray-400 bg-gray-50 dark:bg-gray-800/50";
    }
  };

  if (status === "loading") return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Baza Gostov</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Upravljanje s profilni gostov, zgodovino in privolitvami.</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Išči po imenu, emailu ali telefonu..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors">
            <Filter className="w-4 h-4" />
            Filtri
          </button>
        </div>

        {/* Guest List */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">
                  <th className="px-6 py-4 font-medium">Gost</th>
                  <th className="px-6 py-4 font-medium">Kontakt</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Risk Score</th>
                  <th className="px-6 py-4 font-medium text-center">GDPR</th>
                  <th className="px-6 py-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td colSpan={6} className="px-6 py-6 h-16 bg-gray-50/20 dark:bg-gray-800/10"></td>
                    </tr>
                  ))
                ) : guests.length > 0 ? (
                  guests.map((guest) => (
                    <tr 
                      key={guest.id} 
                      className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors cursor-pointer group"
                      onClick={() => router.push(`/guests/${guest.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 font-bold">
                            {guest.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-bold">{guest.name}</p>
                              {guest.isVip && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              )}
                            </div>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">ID: {guest.id.slice(-6)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Mail className="w-3 h-3" />
                            <span>{guest.email || "Ni vpisan"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Phone className="w-3 h-3" />
                            <span>{guest.phone || "Ni vpisan"}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {guest.isVip ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded text-[10px] font-bold uppercase">VIP</span>
                        ) : (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400 rounded text-[10px] font-bold uppercase">Standard</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase flex items-center gap-1.5 w-fit ${getRiskColor(guest.riskScore)}`}>
                          <ShieldAlert className="w-3 h-3" />
                          {guest.riskScore || "Neznan"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-center">
                          {guest.gdprConsent ? (
                            <CheckCircle2 className="w-5 h-5 text-green-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors inline-block" />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-gray-300" />
                      </div>
                      <h3 className="font-bold text-lg">Ni najdenih gostov</h3>
                      <p className="text-gray-500 mt-1">Poskusite z drugačnim iskalnim nizom.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
