"use client";

import { useState, useEffect } from "react";
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw, 
  Download, 
  FileText, 
  Wallet, 
  ArrowUpRight, 
  ArrowDownRight, 
  Eye, 
  EyeOff, 
  Search, 
  Filter, 
  Calendar,
  Receipt,
  Banknote,
  CreditCard as CreditCardIcon,
  Smartphone,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  AlertCircle,
  Info,
  ChevronDown,
  ChevronUp,
  MoreVertical
} from "lucide-react";

interface Payment {
  id: string;
  reservationId: string;
  guestName: string;
  guestEmail: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "failed" | "refunded" | "partially_refunded";
  paymentMethod: "credit_card" | "bank_transfer" | "cash" | "paypal" | "stripe";
  paymentMethodDetails: {
    last4?: string;
    brand?: string;
    bankName?: string;
    paypalEmail?: string;
  };
  createdAt: string;
  completedAt?: string;
  failedAt?: string;
  refundAmount?: number;
  description: string;
  invoiceId?: string;
  metadata?: {
    propertyId: string;
    propertyName: string;
    checkIn: string;
    checkOut: string;
    roomType: string;
  };
}

interface Refund {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: "pending" | "processed" | "failed";
  createdAt: string;
  processedAt?: string;
  processedBy?: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  reservationId: string;
  guestName: string;
  guestEmail: string;
  amount: number;
  currency: string;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  dueDate: string;
  createdAt: string;
  sentAt?: string;
  paidAt?: string;
  items: {
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }[];
}

interface PaymentMethod {
  id: string;
  type: "credit_card" | "bank_account" | "paypal";
  details: {
    last4?: string;
    brand?: string;
    bankName?: string;
    accountNumber?: string;
    paypalEmail?: string;
  };
  isDefault: boolean;
  createdAt: string;
  status: "active" | "inactive";
}

export default function PaymentsPage() {
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [dateRange, setDateRange] = useState("30");
  const [showPaymentDetails, setShowPaymentDetails] = useState<string | null>(null);

  // Mock data
  const [payments, setPayments] = useState<Payment[]>([
    {
      id: "pay_1",
      reservationId: "res_123",
      guestName: "Janez Novak",
      guestEmail: "janez.novak@email.com",
      amount: 450.00,
      currency: "EUR",
      status: "completed",
      paymentMethod: "credit_card",
      paymentMethodDetails: {
        last4: "4242",
        brand: "Visa"
      },
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      description: "Payment for reservation #123",
      invoiceId: "inv_123",
      metadata: {
        propertyId: "prop_1",
        propertyName: "Hotel Alpina",
        checkIn: "2024-06-15",
        checkOut: "2024-06-18",
        roomType: "Deluxe Room"
      }
    },
    {
      id: "pay_2",
      reservationId: "res_124",
      guestName: "Maja Horvat",
      guestEmail: "maja.horvat@email.com",
      amount: 320.00,
      currency: "EUR",
      status: "pending",
      paymentMethod: "bank_transfer",
      paymentMethodDetails: {
        bankName: "NLB d.d."
      },
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      description: "Payment for reservation #124",
      invoiceId: "inv_124",
      metadata: {
        propertyId: "prop_1",
        propertyName: "Hotel Alpina",
        checkIn: "2024-06-20",
        checkOut: "2024-06-22",
        roomType: "Standard Room"
      }
    },
    {
      id: "pay_3",
      reservationId: "res_125",
      guestName: "Peter Kovačič",
      guestEmail: "peter.kovacic@email.com",
      amount: 580.00,
      currency: "EUR",
      status: "failed",
      paymentMethod: "credit_card",
      paymentMethodDetails: {
        last4: "5555",
        brand: "Mastercard"
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      failedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000 + 2 * 60 * 1000).toISOString(),
      description: "Payment for reservation #125",
      metadata: {
        propertyId: "prop_2",
        propertyName: "Alpine Resort",
        checkIn: "2024-06-25",
        checkOut: "2024-06-28",
        roomType: "Suite"
      }
    }
  ]);

  const [refunds, setRefunds] = useState<Refund[]>([
    {
      id: "ref_1",
      paymentId: "pay_1",
      amount: 150.00,
      reason: "Guest cancellation",
      status: "processed",
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
      processedBy: "Admin User"
    }
  ]);

  const [invoices, setInvoices] = useState<Invoice[]>([
    {
      id: "inv_123",
      invoiceNumber: "INV-2024-001",
      reservationId: "res_123",
      guestName: "Janez Novak",
      guestEmail: "janez.novak@email.com",
      amount: 450.00,
      currency: "EUR",
      status: "paid",
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 1 * 60 * 60 * 1000).toISOString(),
      paidAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 5 * 60 * 1000).toISOString(),
      items: [
        {
          description: "Deluxe Room - 3 nights",
          quantity: 3,
          unitPrice: 150.00,
          total: 450.00
        }
      ]
    }
  ]);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: "pm_1",
      type: "credit_card",
      details: {
        last4: "4242",
        brand: "Visa"
      },
      isDefault: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active"
    },
    {
      id: "pm_2",
      type: "bank_account",
      details: {
        bankName: "NLB d.d.",
        accountNumber: "SI56 1234 5678 9012 345"
      },
      isDefault: false,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(),
      status: "active"
    }
  ]);

  // Calculate statistics
  const totalRevenue = payments
    .filter(p => p.status === "completed")
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingPayments = payments.filter(p => p.status === "pending").length;
  const failedPayments = payments.filter(p => p.status === "failed").length;
  const totalRefunds = refunds.reduce((sum, r) => sum + r.amount, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
      case "refunded": return <ArrowDownRight className="w-4 h-4 text-blue-500" />;
      case "partially_refunded": return <ArrowDownRight className="w-4 h-4 text-orange-500" />;
      default: return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "pending": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed": return "bg-red-100 text-red-800 border-red-200";
      case "refunded": return "bg-blue-100 text-blue-800 border-blue-200";
      case "partially_refunded": return "bg-orange-100 text-orange-800 border-orange-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "credit_card": return <CreditCardIcon className="w-4 h-4" />;
      case "bank_transfer": return <Building className="w-4 h-4" />;
      case "cash": return <Banknote className="w-4 h-4" />;
      case "paypal": return <Wallet className="w-4 h-4" />;
      case "stripe": return <CreditCard className="w-4 h-4" />;
      default: return <CreditCard className="w-4 h-4" />;
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.guestEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === "all" || payment.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleRefund = async (paymentId: string, amount: number, reason: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newRefund: Refund = {
      id: `ref_${Date.now()}`,
      paymentId,
      amount,
      reason,
      status: "processed",
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      processedBy: "Current User"
    };
    
    setRefunds(prev => [...prev, newRefund]);
    setPayments(prev => prev.map(p => 
      p.id === paymentId 
        ? { 
            ...p, 
            status: amount === p.amount ? "refunded" : "partially_refunded" as any,
            refundAmount: amount
          }
        : p
    ));
    
    setLoading(false);
  };

  const handleGenerateInvoice = async (paymentId: string) => {
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const payment = payments.find(p => p.id === paymentId);
    if (payment) {
      const newInvoice: Invoice = {
        id: `inv_${Date.now()}`,
        invoiceNumber: `INV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
        reservationId: payment.reservationId,
        guestName: payment.guestName,
        guestEmail: payment.guestEmail,
        amount: payment.amount,
        currency: payment.currency,
        status: "sent",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        sentAt: new Date().toISOString(),
        items: [
          {
            description: payment.description,
            quantity: 1,
            unitPrice: payment.amount,
            total: payment.amount
          }
        ]
      };
      
      setInvoices(prev => [...prev, newInvoice]);
      setPayments(prev => prev.map(p => 
        p.id === paymentId ? { ...p, invoiceId: newInvoice.id } : p
      ));
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <CreditCard className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Payment Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Download className="w-4 h-4" />
                <span>Export</span>
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
                    <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{pendingPayments}</p>
                  </div>
                  <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-full">
                    <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Failed Payments</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{failedPayments}</p>
                  </div>
                  <div className="bg-red-100 dark:bg-red-900 p-3 rounded-full">
                    <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Refunds</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      €{totalRefunds.toFixed(2)}
                    </p>
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-full">
                    <ArrowDownRight className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Revenue Breakdown */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Revenue Breakdown</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">By Payment Method</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Credit Card</span>
                      <span className="text-sm font-medium">€2,340.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Bank Transfer</span>
                      <span className="text-sm font-medium">€1,120.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Cash</span>
                      <span className="text-sm font-medium">€450.00</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">By Property</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Hotel Alpina</span>
                      <span className="text-sm font-medium">€2,100.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Alpine Resort</span>
                      <span className="text-sm font-medium">€1,800.00</span>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">By Time Period</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">This Week</span>
                      <span className="text-sm font-medium">€1,450.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Last Week</span>
                      <span className="text-sm font-medium">€2,240.00</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === "payments" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Payment History</h2>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Search payments..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  aria-label="Payment status filter"
                  title="Filter payments by status"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Guest
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {payment.guestName}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {payment.guestEmail}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-white">
                            €{payment.amount.toFixed(2)}
                          </div>
                          {payment.refundAmount && (
                            <div className="text-xs text-red-500">
                              Refunded: €{payment.refundAmount.toFixed(2)}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {getPaymentMethodIcon(payment.paymentMethod)}
                            <span className="text-sm text-gray-900 dark:text-white capitalize">
                              {payment.paymentMethod.replace('_', ' ')}
                            </span>
                            {payment.paymentMethodDetails.last4 && (
                              <span className="text-xs text-gray-500">
                                ••••{payment.paymentMethodDetails.last4}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(payment.status)}`}>
                            {getStatusIcon(payment.status)}
                            <span className="ml-1 capitalize">{payment.status.replace('_', ' ')}</span>
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(payment.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => setShowPaymentDetails(payment.id)}
                              aria-label="View payment details"
                              title="View payment details"
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {payment.status === "completed" && !payment.refundAmount && (
                              <button
                                onClick={() => handleRefund(payment.id, payment.amount, "Guest request")}
                                disabled={loading}
                                aria-label="Process refund"
                                title="Process full refund for this payment"
                                className="text-orange-600 hover:text-orange-900 dark:text-orange-400 dark:hover:text-orange-300"
                              >
                                <ArrowDownRight className="w-4 h-4" />
                              </button>
                            )}
                            {!payment.invoiceId && payment.status === "completed" && (
                              <button
                                onClick={() => handleGenerateInvoice(payment.id)}
                                disabled={loading}
                                aria-label="Generate invoice"
                                title="Generate invoice for this payment"
                                className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                              >
                                <FileText className="w-4 h-4" />
                              </button>
                            )}
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

        {/* Refunds Tab */}
        {activeTab === "refunds" && (
          <div className="space-y-6">
            <h2 className="text-lg font-medium text-gray-900 dark:text-white">Refund Processing</h2>
            
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Payment
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Reason
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {refunds.map((refund) => {
                      const payment = payments.find(p => p.id === refund.paymentId);
                      return (
                        <tr key={refund.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {payment?.guestName || 'Unknown'}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {payment?.description}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              €{refund.amount.toFixed(2)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">
                              {refund.reason}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                              refund.status === 'processed' 
                                ? 'bg-green-100 text-green-800 border-green-200' 
                                : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            }`}>
                              {refund.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {new Date(refund.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === "invoices" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Invoice Generation</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <FileText className="w-4 h-4" />
                <span>Generate Invoice</span>
              </button>
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
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {invoice.invoiceNumber}
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
                            €{invoice.amount.toFixed(2)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            invoice.status === 'paid' 
                              ? 'bg-green-100 text-green-800 border-green-200' 
                              : invoice.status === 'sent'
                              ? 'bg-blue-100 text-blue-800 border-blue-200'
                              : invoice.status === 'overdue'
                              ? 'bg-red-100 text-red-800 border-red-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(invoice.dueDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            <button 
                              aria-label="View invoice details"
                              title="View invoice details"
                              className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
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

        {/* Payment Methods Tab */}
        {activeTab === "methods" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white">Payment Method Management</h2>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">
                <Plus className="w-4 h-4" />
                <span>Add Method</span>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {paymentMethods.map((method) => (
                <div key={method.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {getPaymentMethodIcon(method.type)}
                      <div>
                        <h3 className="text-md font-medium text-gray-900 dark:text-white capitalize">
                          {method.type.replace('_', ' ')}
                        </h3>
                        {method.isDefault && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Default
                          </span>
                        )}
                      </div>
                    </div>
                    <button 
                      aria-label="Payment method options"
                      title="View payment method options"
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <MoreVertical className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {method.details.last4 && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Card Number:</span>
                        <span className="text-gray-900 dark:text-white">••••{method.details.last4}</span>
                      </div>
                    )}
                    {method.details.brand && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Brand:</span>
                        <span className="text-gray-900 dark:text-white">{method.details.brand}</span>
                      </div>
                    )}
                    {method.details.bankName && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Bank:</span>
                        <span className="text-gray-900 dark:text-white">{method.details.bankName}</span>
                      </div>
                    )}
                    {method.details.accountNumber && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Account:</span>
                        <span className="text-gray-900 dark:text-white">{method.details.accountNumber}</span>
                      </div>
                    )}
                    {method.details.paypalEmail && (
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">PayPal:</span>
                        <span className="text-gray-900 dark:text-white">{method.details.paypalEmail}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Status:</span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        method.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {method.status}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Added:</span>
                      <span className="text-gray-900 dark:text-white">
                        {new Date(method.createdAt).toLocaleDateString()}
                      </span>
                    </div>
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
                { id: "overview", name: "Overview", icon: TrendingUp },
                { id: "payments", name: "Payments", icon: CreditCard },
                { id: "refunds", name: "Refunds", icon: ArrowDownRight },
                { id: "invoices", name: "Invoices", icon: FileText },
                { id: "methods", name: "Payment Methods", icon: Wallet }
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
