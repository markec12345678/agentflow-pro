"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Send, 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  User,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Save,
  Copy,
  Printer,
  Share2,
  Settings,
  Repeat,
  Calculator,
  File,
  Building,
  Percent,
  TrendingUp,
  BarChart3,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  MoreHorizontal
} from "lucide-react";

interface Invoice {
  id: string;
  invoiceNumber: string;
  reservationId: string;
  guestName: string;
  guestEmail: string;
  guestPhone?: string;
  guestAddress?: {
    street: string;
    city: string;
    country: string;
    postalCode: string;
  };
  amount: number;
  currency: string;
  taxAmount: number;
  totalAmount: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  items: InvoiceItem[];
  template: string;
  taxRate: number;
  notes?: string;
  paymentTerms?: string;
  recurring?: {
    frequency: "weekly" | "monthly" | "quarterly";
    nextInvoiceDate: string;
    endDate?: string;
  };
}

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate: number;
  total: number;
}

interface InvoiceTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  template: {
    header: string;
    footer: string;
    layout: "standard" | "detailed" | "minimal";
    colors: {
      primary: string;
      secondary: string;
    };
    logo?: string;
    companyInfo: {
      name: string;
      address: string;
      phone: string;
      email: string;
      taxId: string;
    };
  };
}

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [showInvoiceDetails, setShowInvoiceDetails] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Mock data
  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "inv_123",
      invoiceNumber: "INV-2024-001",
      reservationId: "res_123",
      guestName: "Janez Novak",
      guestEmail: "janez.novak@email.com",
      guestPhone: "+386 1 234 5678",
      guestAddress: {
        street: "Cankarjeva ulica 5",
        city: "Ljubljana",
        country: "Slovenia",
        postalCode: "1000"
      },
      amount: 450.00,
      currency: "EUR",
      taxAmount: 94.50,
      totalAmount: 544.50,
      status: "paid",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: "item_1",
          description: "Deluxe Room - 3 nights",
          quantity: 3,
          unitPrice: 150.00,
          taxRate: 21,
          total: 450.00
        }
      ],
      template: "standard",
      taxRate: 21,
      notes: "Payment due within 7 days. Thank you for your business!",
      paymentTerms: "Net 7"
    },
    {
      id: "inv_124",
      invoiceNumber: "INV-2024-002",
      reservationId: "res_124",
      guestName: "Maja Horvat",
      guestEmail: "maja.horvat@email.com",
      amount: 320.00,
      currency: "EUR",
      taxAmount: 67.20,
      totalAmount: 387.20,
      status: "sent",
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      sentAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: "item_2",
          description: "Standard Room - 2 nights",
          quantity: 2,
          unitPrice: 160.00,
          taxRate: 21,
          total: 320.00
        }
      ],
      template: "standard",
      taxRate: 21,
      paymentTerms: "Net 7"
    },
    {
      id: "inv_125",
      invoiceNumber: "INV-2024-003",
      reservationId: "res_125",
      guestName: "Peter Kovačič",
      guestEmail: "peter.kovacic@email.com",
      amount: 1200.00,
      currency: "EUR",
      taxAmount: 252.00,
      totalAmount: 1452.00,
      status: "draft",
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      items: [
        {
          id: "item_3",
          description: "Suite - 7 nights (Long stay)",
          quantity: 7,
          unitPrice: 171.43,
          discount: 10,
          taxRate: 21,
          total: 1200.00
        }
      ],
      template: "detailed",
      taxRate: 21,
      recurring: {
        frequency: "weekly",
        nextInvoiceDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      }
    }
  ]);

  const [templates, setTemplates] = useState<InvoiceTemplate[]>([
    {
      id: "tpl_1",
      name: "Standard Template",
      description: "Clean and professional invoice template",
      isDefault: true,
      template: {
        header: "INVOICE",
        footer: "Thank you for your business!",
        layout: "standard",
        colors: {
          primary: "#2563eb",
          secondary: "#64748b"
        },
        companyInfo: {
          name: "Hotel Alpina",
          address: "Cankarjeva ulica 5, 1000 Ljubljana",
          phone: "+386 1 234 5678",
          email: "info@hotel-alpina.si",
          taxId: "SI12345678"
        }
      }
    },
    {
      id: "tpl_2",
      name: "Detailed Template",
      description: "Comprehensive template with detailed breakdown",
      isDefault: false,
      template: {
        header: "DETAILED INVOICE",
        footer: "Payment terms and conditions apply",
        layout: "detailed",
        colors: {
          primary: "#059669",
          secondary: "#6b7280"
        },
        companyInfo: {
          name: "Hotel Alpina",
          address: "Cankarjeva ulica 5, 1000 Ljubljana",
          phone: "+386 1 234 5678",
          email: "info@hotel-alpina.si",
          taxId: "SI12345678"
        }
      }
    }
  ]);

  // Calculate statistics
  const totalRevenue = invoices
    .filter(i => i.status === "paid")
    .reduce((sum, i) => sum + i.totalAmount, 0);

  const pendingInvoices = invoices.filter(i => i.status === "sent").length;
  const draftInvoices = invoices.filter(i => i.status === "draft").length;
  const overdueInvoices = invoices.filter(i => i.status === "overdue").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "sent": return <Send className="w-4 h-4 text-blue-500" />;
      case "draft": return <FileText className="w-4 h-4 text-gray-500" />;
      case "overdue": return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case "cancelled": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "paid": return "bg-green-100 text-green-800 border-green-200";
      case "sent": return "bg-blue-100 text-blue-800 border-blue-200";
      case "draft": return "bg-gray-100 text-gray-800 border-gray-200";
      case "overdue": return "bg-red-100 text-red-800 border-red-200";
      case "cancelled": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const filteredInvoices = invoices.filter(invoice => {
    const matchesSearch = invoice.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || invoice.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleGenerateInvoice = async (invoiceId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Generate PDF (in real implementation)
    console.log('Generating PDF for invoice:', invoiceId);
    
    setLoading(false);
  };

  const handleSendInvoice = async (invoiceId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Send invoice (in real implementation)
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId 
        ? { ...inv, status: "sent" as const, sentAt: new Date().toISOString() }
        : inv
    ));
    
    setLoading(false);
  };

  const handleDownloadInvoice = async (invoiceId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Download PDF (in real implementation)
    console.log('Downloading invoice:', invoiceId);
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Invoices</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Templates</span>
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Generate Invoice</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Revenue</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      €{totalRevenue.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-900 p-3 rounded-full">
                    <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Invoices</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingInvoices}</p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Draft Invoices</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{draftInvoices}</p>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-900 p-3 rounded-full">
                    <FileText className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue Invoices</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{overdueInvoices}</p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Invoices */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recent Invoices</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {invoices.slice(0, 5).map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.invoiceNumber}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {invoice.guestName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {invoice.guestEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            €{invoice.totalAmount.toFixed(2)}
                          </div>
                          {invoice.taxAmount > 0 && (
                            <div className="text-xs text-gray-500">
                              incl. €{invoice.taxAmount.toFixed(2)} tax
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">{invoice.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleGenerateInvoice(invoice.id)}
                              disabled={loading}
                              aria-label="Generate invoice"
                              title="Generate invoice PDF"
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSendInvoice(invoice.id)}
                              disabled={loading || invoice.status !== "draft"}
                              aria-label="Send invoice"
                              title="Send invoice to customer"
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              disabled={loading}
                              aria-label="Download invoice"
                              title="Download invoice PDF"
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* All Invoices Tab */}
        {activeTab === "all" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">All Invoices</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search invoices..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  aria-label="Invoice status filter"
                  title="Filter invoices by status"
                >
                  <option value="all">All Status</option>
                  <option value="draft">Draft</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Recurring
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredInvoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.invoiceNumber}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(invoice.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900 dark:text-white">
                              {invoice.guestName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {invoice.guestEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            €{invoice.totalAmount.toFixed(2)}
                          </div>
                          {invoice.taxAmount > 0 && (
                            <div className="text-xs text-gray-500">
                              incl. €{invoice.taxAmount.toFixed(2)} tax
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status)}`}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">{invoice.status}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {invoice.recurring ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                              <Repeat className="w-3 h-3 mr-1" />
                              {invoice.recurring.frequency}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setShowInvoiceDetails(invoice.id)}
                              aria-label="View invoice details"
                              title="View invoice details"
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleGenerateInvoice(invoice.id)}
                              disabled={loading}
                              aria-label="Generate invoice"
                              title="Generate invoice PDF"
                              className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleSendInvoice(invoice.id)}
                              disabled={loading || invoice.status !== "draft"}
                              aria-label="Send invoice"
                              title="Send invoice to customer"
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 disabled:opacity-50"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDownloadInvoice(invoice.id)}
                              disabled={loading}
                              aria-label="Download invoice"
                              title="Download invoice PDF"
                              className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-300"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Templates Tab */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Invoice Templates</h2>
              <button 
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                aria-label="Create invoice template"
                title="Create new invoice template"
              >
                <Plus className="w-4 h-4" />
                <span>Create Template</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map((template) => (
                <div key={template.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-md font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {template.description}
                      </p>
                    </div>
                    {template.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        Default
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Layout:</span>
                      <span className="text-gray-900 dark:text-white capitalize">{template.template.layout}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Company:</span>
                      <span className="text-gray-900 dark:text-white">{template.template.companyInfo.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tax ID:</span>
                      <span className="text-gray-900 dark:text-white">{template.template.companyInfo.taxId}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 mt-4">
                    <button 
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                      aria-label="Preview template"
                      title="Preview invoice template"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Preview</span>
                    </button>
                    <button 
                      className="flex items-center space-x-1 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-800"
                      aria-label="Edit template"
                      title="Edit invoice template"
                    >
                      <Edit className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                    {!template.isDefault && (
                      <button 
                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-800"
                        aria-label="Delete template"
                        title="Delete invoice template"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: "overview", name: "Overview", icon: BarChart3 },
                { id: "all", name: "All Invoices", icon: FileText },
                { id: "templates", name: "Templates", icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? "border-blue-500 text-blue-600 dark:text-blue-400"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </div>
  );
}
