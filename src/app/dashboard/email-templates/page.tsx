"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Mail,
  MessageSquare,
  Plus,
  Save,
  Eye,
  Edit3,
  Trash2,
  Search,
  Filter,
  Copy,
  Download,
  RefreshCcw,
  X,
  Check,
  ChevronLeft,
  Palette,
  Type,
  Image as ImageIcon,
  Link as LinkIcon,
  Smartphone,
  Monitor
} from "lucide-react";
import { toast } from "sonner";
import {
  EMAIL_TEMPLATES,
  SMS_TEMPLATES,
  renderEmailTemplate,
  renderSMSTemplate,
  getTemplatesByCategory,
  getSMSTemplatesByCategory,
  EmailTemplate,
  SMSTemplate
} from "@/lib/email-templates/guest-templates";

type TemplateType = "email" | "sms";
type Category = "all" | "pre-arrival" | "during-stay" | "post-stay" | "booking" | "payment" | "cancellation" | "review";

export default function EmailTemplatesPage() {
  const { status } = useSession();
  const [activeTab, setActiveTab] = useState<TemplateType>("email");
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | SMSTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [showPreview, setShowPreview] = useState(true);

  // Editor state
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [testVariables, setTestVariables] = useState<Record<string, string>>({
    guest_name: "Janez Novak",
    property_name: "Villa Bled",
    check_in_date: "20. 3. 2026",
    check_out_date: "25. 3. 2026",
    room_number: "101",
    guest_count: "2",
    property_address: "Cesta svobode 1",
    property_city: "Bled",
    property_country: "Slovenija",
    property_phone: "+386 40 123 456",
    property_email: "info@villabled.si",
    check_in_link: "https://villabled.si/checkin",
    review_link: "https://g.page/r/abc123/review",
    discount_code: "HVALA10",
    discount_expiry: "31. 12. 2026",
    amount: "150",
    currency: "EUR",
    reservation_id: "RES-12345",
    parking_instructions: "Brezplačno parkirišče pred objektom"
  });

  const [emailTemplates, setEmailTemplates] = useState<EmailTemplate[]>([]);
  const [smsTemplates, setSmsTemplates] = useState<SMSTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  // Load templates
  useEffect(() => {
    if (status === "authenticated") {
      setEmailTemplates(Object.values(EMAIL_TEMPLATES));
      setSmsTemplates(Object.values(SMS_TEMPLATES));
      setLoading(false);
    }
  }, [status]);

  // Filter templates
  const filteredEmailTemplates = emailTemplates.filter(template => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const filteredSmsTemplates = smsTemplates.filter(template => {
    const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleSelectTemplate = (template: EmailTemplate | SMSTemplate) => {
    setSelectedTemplate(template);
    setIsEditing(false);
    if ("subject" in template) {
      setEditSubject(template.subject);
      setEditBody(template.body);
    } else {
      setEditBody(template.body);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;

    try {
      // In production, save to database via API
      // For now, just show success toast
      toast.success(`Predloga "${selectedTemplate.name}" shranjena`);
      setIsEditing(false);
    } catch (error) {
      toast.error("Napaka pri shranjevanju");
    }
  };

  const handleInsertVariable = (variable: string) => {
    const cursorPos = document.getElementById("template-body")?.selectionStart || 0;
    const textBefore = editBody.substring(0, cursorPos);
    const textAfter = editBody.substring(cursorPos);
    setEditBody(textBefore + `{{${variable}}}` + textAfter);
  };

  const renderPreview = () => {
    if (!selectedTemplate) return null;

    try {
      if (activeTab === "email" && "subject" in selectedTemplate) {
        const rendered = renderEmailTemplate(selectedTemplate.id, testVariables);
        return (
          <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">Zadeva:</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{rendered.subject}</p>
            </div>
            <div
              className="p-6 prose dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: rendered.body }}
            />
          </div>
        );
      } else if (activeTab === "sms" && !("subject" in selectedTemplate)) {
        const rendered = renderSMSTemplate(selectedTemplate.id, testVariables);
        return (
          <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-gray-400" />
                <span className="text-sm font-bold text-gray-700 dark:text-gray-300">SMS Predogled</span>
              </div>
              <div className="text-xs text-gray-500">
                {rendered.characterCount} znakov • {rendered.segmentCount} SMS
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {rendered.body}
              </p>
            </div>
            {rendered.characterCount > 160 && (
              <p className="text-xs text-amber-600 mt-2">
                ⚠️ SMS presega 160 znakov in bo razdeljen na {rendered.segmentCount} delov
              </p>
            )}
          </div>
        );
      }
    } catch (error) {
      return (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">
            Napaka pri predogledu: {error instanceof Error ? error.message : "Neznana napaka"}
          </p>
        </div>
      );
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    const classes: Record<string, string> = {
      "pre-arrival": "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      "during-stay": "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      "post-stay": "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
      "booking": "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400",
      "payment": "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400",
      "cancellation": "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
      "review": "bg-pink-100 text-pink-700 dark:bg-pink-900/20 dark:text-pink-400"
    };
    return classes[category] || "bg-gray-100 text-gray-700";
  };

  const getCategoryName = (category: string) => {
    const names: Record<string, string> = {
      "pre-arrival": "Pred prihodom",
      "during-stay": "Med bivanjem",
      "post-stay": "Po odhodu",
      "booking": "Rezervacija",
      "payment": "Plačilo",
      "cancellation": "Preklic",
      "review": "Mnenje"
    };
    return names[category] || category;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCcw className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => window.history.back()}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  Urejevalnik Predlog
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Email & SMS predloge za komunikacijo z gosti
                </p>
              </div>
            </div>
            <button
              onClick={() => toast.info("Funkcija v pripravi")}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-4 h-4" />
              Nova Predloga
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab("email")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "email"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <Mail className="w-4 h-4" />
            Email Predloge
          </button>
          <button
            onClick={() => setActiveTab("sms")}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              activeTab === "sms"
                ? "bg-indigo-600 text-white"
                : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            SMS Predloge
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Išči predloge..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex gap-2 overflow-x-auto">
              <button
                onClick={() => setSelectedCategory("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedCategory === "all"
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                Vse
              </button>
              {["pre-arrival", "during-stay", "post-stay", "booking", "payment", "cancellation", "review"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat as Category)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                  }`}
                >
                  {getCategoryName(cat)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4">
              {activeTab === "email" ? "Email Predloge" : "SMS Predloge"} ({activeTab === "email" ? filteredEmailTemplates.length : filteredSmsTemplates.length})
            </h2>
            {activeTab === "email" ? (
              filteredEmailTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedTemplate?.id === template.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {template.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryBadgeClass(template.category)}`}>
                      {getCategoryName(template.category)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {template.subject}
                  </p>
                </button>
              ))
            ) : (
              filteredSmsTemplates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => handleSelectTemplate(template)}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    selectedTemplate?.id === template.id
                      ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-300 dark:hover:border-indigo-700"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {template.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getCategoryBadgeClass(template.category)}`}>
                      {getCategoryName(template.category)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {template.body.substring(0, 60)}...
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Editor & Preview */}
          <div className="lg:col-span-2 space-y-6">
            {selectedTemplate ? (
              <>
                {/* Toolbar */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={isEditing ? handleSave : handleEdit}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                        isEditing
                          ? "bg-green-600 text-white hover:bg-green-700"
                          : "bg-indigo-600 text-white hover:bg-indigo-700"
                      }`}
                    >
                      {isEditing ? <Check className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                      {isEditing ? "Shrani" : "Uredi"}
                    </button>
                    <button
                      onClick={() => setShowPreview(!showPreview)}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-all"
                    >
                      <Eye className="w-4 h-4" />
                      {showPreview ? "Skrij" : "Pokaži"} Predogled
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    {showPreview && (
                      <>
                        <button
                          onClick={() => setPreviewMode("desktop")}
                          className={`p-2 rounded-lg transition-all ${
                            previewMode === "desktop"
                              ? "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600"
                              : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          <Monitor className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setPreviewMode("mobile")}
                          className={`p-2 rounded-lg transition-all ${
                            previewMode === "mobile"
                              ? "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600"
                              : "text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          }`}
                        >
                          <Smartphone className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isEditing && (
                  <>
                    {/* Variable Insertion */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                      <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                        Vstavi Spremenljivko
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedTemplate.variables.map((variable) => (
                          <button
                            key={variable}
                            onClick={() => handleInsertVariable(variable)}
                            className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all"
                          >
                            {`{{${variable}}}`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Editor */}
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                      {activeTab === "email" && "subject" in selectedTemplate && (
                        <div className="mb-4">
                          <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                            Zadeva
                          </label>
                          <input
                            type="text"
                            value={editSubject}
                            onChange={(e) => setEditSubject(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                          Vsebina
                        </label>
                        <textarea
                          id="template-body"
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={activeTab === "email" ? 15 : 5}
                          className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Test Variables */}
                <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-800">
                  <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Testni Podatki
                  </h3>
                  <div className="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                    {Object.entries(testVariables).map(([key, value]) => (
                      <div key={key}>
                        <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                          {key}
                        </label>
                        <input
                          type="text"
                          value={value}
                          onChange={(e) => setTestVariables({ ...testVariables, [key]: e.target.value })}
                          className="w-full px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Preview */}
                {showPreview && (
                  <div className={`${previewMode === "mobile" ? "max-w-md mx-auto" : ""}`}>
                    {renderPreview()}
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-xl p-12 border border-gray-200 dark:border-gray-800 text-center">
                <Mail className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Izberite Predlogo
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Izberite predlogo s sezoma na levi za ogled ali urejanje
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
