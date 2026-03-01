"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { PropertySelector } from "@/web/components/PropertySelector";

interface Inquiry {
  id: string;
  propertyId: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  type: string;
  status: string;
  source: string;
  checkIn: string | null;
  checkOut: string | null;
  guestCount: number | null;
  createdAt: string;
}

type StatusFilter = "all" | "new" | "read" | "replied" | "closed";

export default function DirectorInboxPage() {
  const searchParams = useSearchParams();
  const [activePropertyId, setActivePropertyId] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  useEffect(() => {
    const prop = searchParams.get("propertyId");
    const status = searchParams.get("status");
    if (prop) setActivePropertyId(prop);
    if (status && ["all", "new", "read", "replied", "closed"].includes(status)) {
      setStatusFilter(status as StatusFilter);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchInquiries();
  }, [activePropertyId, statusFilter]);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activePropertyId) params.set("propertyId", activePropertyId);
      params.set("status", statusFilter);
      const res = await fetch(`/api/tourism/inquiries?${params}`);
      const data = await res.json();
      setInquiries(data.inquiries ?? []);
      setTotal(data.total ?? 0);
    } catch (error) {
      toast.error("Napaka pri nalaganju povpraševanj");
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: "read" | "replied" | "closed") => {
    try {
      const res = await fetch(`/api/tourism/inquiries/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setInquiries((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status } : i))
      );
      if (selectedInquiry?.id === id) {
        setSelectedInquiry({ ...selectedInquiry, status });
      }
      toast.success("Posodobljeno");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Napaka");
    }
  };

  const newCountWhenAll =
    statusFilter === "all" ? inquiries.filter((i) => i.status === "new").length : 0;

  const tabs: { id: StatusFilter; label: string; count?: number }[] = [
    { id: "all", label: "Vse", count: statusFilter === "all" ? total : undefined },
    {
      id: "new",
      label: "Nova",
      count:
        statusFilter === "new" ? total : statusFilter === "all" ? newCountWhenAll : undefined,
    },
    { id: "read", label: "Prebrana", count: statusFilter === "read" ? total : undefined },
    { id: "replied", label: "Odgovorjena", count: statusFilter === "replied" ? total : undefined },
    { id: "closed", label: "Zaprta", count: statusFilter === "closed" ? total : undefined },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Povpraševanja
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Povpraševanja, ponudbe in komunikacije na enem mestu
          </p>
        </div>
        <PropertySelector value={activePropertyId} onChange={setActivePropertyId} />
      </div>

      <div className="border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-wrap gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`pb-3 px-1 font-medium text-sm border-b-2 transition-colors ${statusFilter === tab.id
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-400"
                }`}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <h2 className="font-semibold">Seznam povpraševanj</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">Nalaganje...</div>
        ) : inquiries.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Ni povpraševanj. Nova povpraševanja se prikažejo tukaj (iz FAQ, formulirjev ali ročnega vnosa).
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {inquiries.map((inq) => (
              <div
                key={inq.id}
                onClick={() => setSelectedInquiry(inq)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${inq.status === "new"
                            ? "bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300"
                            : inq.status === "replied"
                              ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                              : inq.status === "closed"
                                ? "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300"
                          }`}
                      >
                        {inq.status === "new"
                          ? "Novo"
                          : inq.status === "read"
                            ? "Prebrano"
                            : inq.status === "replied"
                              ? "Odgovorjeno"
                              : "Zaprto"}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${inq.source === "faq_escalation"
                            ? "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                            : inq.source === "form"
                              ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                          }`}
                      >
                        {inq.source === "faq_escalation"
                          ? "FAQ"
                          : inq.source === "form"
                            ? "Forma"
                            : "Ročno"}
                      </span>
                      <span className="text-xs text-gray-500 capitalize">{inq.type}</span>
                    </div>
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {inq.name} &lt;{inq.email}&gt;
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mt-0.5">
                      {inq.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(inq.createdAt).toLocaleString("sl-SI")}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedInquiry && (
        <InquiryDetailPanel
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onStatusChange={updateStatus}
          onRefresh={fetchInquiries}
        />
      )}
    </div>
  );
}

function InquiryDetailPanel({
  inquiry,
  onClose,
  onStatusChange,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  onStatusChange: (id: string, status: "read" | "replied" | "closed") => void;
}) {
  const mailto = `mailto:${inquiry.email}?subject=Re: Povpraševanje`;
  const statusLabels: Record<string, string> = {
    new: "Novo",
    read: "Prebrano",
    replied: "Odgovorjeno",
    closed: "Zaprto",
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white dark:bg-gray-900 shadow-xl z-50 flex flex-col">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold">Podrobnosti</h3>
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label="Zapri"
        >
          ×
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <span className="text-xs text-gray-500">Status</span>
          <p className="font-medium">{statusLabels[inquiry.status] ?? inquiry.status}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Ime</span>
          <p className="font-medium">{inquiry.name}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">E-pošta</span>
          <a
            href={mailto}
            className="text-blue-600 dark:text-blue-400 hover:underline break-all"
          >
            {inquiry.email}
          </a>
        </div>
        {inquiry.phone && (
          <div>
            <span className="text-xs text-gray-500">Telefon</span>
            <p>{inquiry.phone}</p>
          </div>
        )}
        <div>
          <span className="text-xs text-gray-500">Tip</span>
          <p className="capitalize">{inquiry.type}</p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Vir</span>
          <p>
            {inquiry.source === "faq_escalation"
              ? "FAQ eskalacija"
              : inquiry.source === "form"
                ? "Kontaktna forma"
                : "Ročni vnos"}
          </p>
        </div>
        <div>
          <span className="text-xs text-gray-500">Sporočilo</span>
          <p className="mt-1 whitespace-pre-wrap text-gray-800 dark:text-gray-200">
            {inquiry.message}
          </p>
        </div>
        {(inquiry.checkIn || inquiry.checkOut || inquiry.guestCount) && (
          <div className="grid grid-cols-2 gap-2">
            {inquiry.checkIn && (
              <div>
                <span className="text-xs text-gray-500">Prileganje</span>
                <p>{new Date(inquiry.checkIn).toLocaleDateString("sl-SI")}</p>
              </div>
            )}
            {inquiry.checkOut && (
              <div>
                <span className="text-xs text-gray-500">Odhod</span>
                <p>{new Date(inquiry.checkOut).toLocaleDateString("sl-SI")}</p>
              </div>
            )}
            {inquiry.guestCount && (
              <div>
                <span className="text-xs text-gray-500">Št. gostov</span>
                <p>{inquiry.guestCount}</p>
              </div>
            )}
          </div>
        )}
        <p className="text-xs text-gray-500">
          Ustvarjeno: {new Date(inquiry.createdAt).toLocaleString("sl-SI")}
        </p>
      </div>
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <a
          href={mailto}
          className="block w-full py-2.5 rounded-lg bg-blue-600 text-white text-center font-medium hover:bg-blue-700 transition-colors"
        >
          Odgovori prek e-pošte
        </a>
        <div className="flex gap-2 flex-wrap">
          {inquiry.status === "new" && (
            <button
              onClick={() => onStatusChange(inquiry.id, "read")}
              className="flex-1 min-w-[120px] py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Označi prebrano
            </button>
          )}
          {inquiry.status !== "replied" && inquiry.status !== "closed" && (
            <button
              onClick={() => onStatusChange(inquiry.id, "replied")}
              className="flex-1 min-w-[120px] py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Označi odgovorjeno
            </button>
          )}
          {inquiry.status !== "closed" && (
            <button
              onClick={() => onStatusChange(inquiry.id, "closed")}
              className="flex-1 min-w-[120px] py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Zapri
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
