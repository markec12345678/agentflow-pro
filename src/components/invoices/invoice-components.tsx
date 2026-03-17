/**
 * Invoice Management UI Components
 * 
 * Components for creating, viewing, and managing invoices.
 */

'use client';

import React, { useState } from 'react';

interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  totalAmount: number;
  status: 'DRAFT' | 'ISSUED' | 'SENT' | 'PAID' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  createdAt: string;
}

/**
 * Invoice List Component
 */

export function InvoiceList({ propertyId }: { propertyId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  React.useEffect(() => {
    async function fetchInvoices() {
      try {
        const response = await fetch(`/api/v1/billing/invoices?propertyId=${propertyId}`);
        const result = await response.json();
        setInvoices(result.invoices);
      } catch (error) {
        console.error('Failed to fetch invoices:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchInvoices();
  }, [propertyId]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      ISSUED: 'bg-blue-100 text-blue-700',
      SENT: 'bg-purple-100 text-purple-700',
      PAID: 'bg-green-100 text-green-700',
      OVERDUE: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-gray-100 text-gray-400',
    };
    return badges[status] || badges.DRAFT;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      DRAFT: 'Osnutek',
      ISSUED: 'Izdan',
      SENT: 'Poslan',
      PAID: 'Plačan',
      OVERDUE: 'Zapadel',
      CANCELLED: 'Preklican',
    };
    return labels[status] || status;
  };

  const filteredInvoices =
    filter === 'all' ? invoices : invoices.filter((inv) => inv.status === filter);

  if (loading) {
    return <div className="text-center py-8">Loading invoices...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Računi / Invoices
        </h3>
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="all">Vsi / All</option>
            <option value="DRAFT">Osnutki / Drafts</option>
            <option value="ISSUED">Izdani / Issued</option>
            <option value="SENT">Poslani / Sent</option>
            <option value="PAID">Plačani / Paid</option>
            <option value="OVERDUE">Zapadli / Overdue</option>
          </select>
          <button
            onClick={() => (window.location.href = '/dashboard/invoices/create')}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            + Nov račun / New Invoice
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Številka / Number
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Kupec / Customer
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Znesek / Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Zapade / Due
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Akcije / Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredInvoices.map((invoice) => (
              <tr
                key={invoice.id}
                className="hover:bg-gray-50"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {invoice.invoiceNumber}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {invoice.customerName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  €{invoice.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                  {new Date(invoice.dueDate).toLocaleDateString('sl-SI')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                      invoice.status
                    )}`}
                  >
                    {getStatusLabel(invoice.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <a
                    href={`/dashboard/invoices/${invoice.id}`}
                    className="text-blue-600 hover:text-blue-900 mr-3"
                  >
                    Ogled / View
                  </a>
                  {invoice.status === 'DRAFT' && (
                    <button className="text-green-600 hover:text-green-900 mr-3">
                      Uredi / Edit
                    </button>
                  )}
                  {invoice.status === 'ISSUED' && (
                    <button className="text-purple-600 hover:text-purple-900 mr-3">
                      Pošlji / Send
                    </button>
                  )}
                  {invoice.status !== 'PAID' && invoice.status !== 'CANCELLED' && (
                    <button className="text-green-600 hover:text-green-900">
                      Označi plačano / Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredInvoices.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Ni računov / No invoices found
        </div>
      )}
    </div>
  );
}

/**
 * Invoice Form Component (Create/Edit)
 */

interface InvoiceFormData {
  customerName: string;
  customerEmail: string;
  customerAddress: string;
  customerPostalCode: string;
  customerCity: string;
  customerCountry: string;
  customerTaxNumber?: string;
  items: Array<{
    description: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    vatRate: 'ACCOMMODATION' | 'FOOD' | 'SERVICES' | 'STANDARD';
  }>;
  paymentTerms: number;
  customerNotes?: string;
}

export function InvoiceForm({
  propertyId,
  onSubmit,
}: {
  propertyId: string;
  onSubmit?: () => void;
}) {
  const [formData, setFormData] = useState<InvoiceFormData>({
    customerName: '',
    customerEmail: '',
    customerAddress: '',
    customerPostalCode: '',
    customerCity: '',
    customerCountry: 'SI',
    customerTaxNumber: '',
    items: [
      {
        description: '',
        quantity: 1,
        unit: 'kos',
        unitPrice: 0,
        vatRate: 'ACCOMMODATION',
      },
    ],
    paymentTerms: 14,
    customerNotes: '',
  });

  const [calculating, setCalculating] = useState(false);
  const [totals, setTotals] = useState({
    subtotal: 0,
    vat: 0,
    total: 0,
  });

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          description: '',
          quantity: 1,
          unit: 'kos',
          unitPrice: 0,
          vatRate: 'ACCOMMODATION',
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  const updateItem = (
    index: number,
    field: string,
    value: string | number
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const calculateTotals = async () => {
    setCalculating(true);
    try {
      let accommodationAmount = 0;
      let foodAmount = 0;
      let servicesAmount = 0;

      formData.items.forEach((item) => {
        const amount = item.quantity * item.unitPrice;
        if (item.vatRate === 'ACCOMMODATION') {
          accommodationAmount += amount;
        } else if (item.vatRate === 'FOOD') {
          foodAmount += amount;
        } else {
          servicesAmount += amount;
        }
      });

      const response = await fetch('/api/tax/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: new Date().toISOString(),
          checkOut: new Date(Date.now() + 86400000).toISOString(),
          municipality: 'ljubljana',
          guests: [{ age: 30 }],
          accommodationAmount,
          foodAmount,
          servicesAmount,
        }),
      });

      const result = await response.json();
      setTotals({
        subtotal: result.data.totals.subtotal,
        vat: result.data.totals.totalVAT,
        total: result.data.totals.grandTotal,
      });
    } catch (error) {
      console.error('Failed to calculate totals:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/v1/billing/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyId,
          ...formData,
        }),
      });

      if (response.ok) {
        alert('Invoice created successfully!');
        onSubmit?.();
      } else {
        alert('Failed to create invoice');
      }
    } catch (error) {
      console.error('Failed to create invoice:', error);
      alert('Error creating invoice');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold mb-4">
          Podatki o kupcu / Customer Information
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ime in priimek / Name *
            </label>
            <input
              type="text"
              required
              value={formData.customerName}
              onChange={(e) =>
                setFormData({ ...formData, customerName: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              required
              value={formData.customerEmail}
              onChange={(e) =>
                setFormData({ ...formData, customerEmail: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Naslov / Address *
            </label>
            <input
              type="text"
              required
              value={formData.customerAddress}
              onChange={(e) =>
                setFormData({ ...formData, customerAddress: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Poštna številka / Postal Code *
            </label>
            <input
              type="text"
              required
              value={formData.customerPostalCode}
              onChange={(e) =>
                setFormData({ ...formData, customerPostalCode: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kraj / City *
            </label>
            <input
              type="text"
              required
              value={formData.customerCity}
              onChange={(e) =>
                setFormData({ ...formData, customerCity: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Davčna številka / Tax ID
            </label>
            <input
              type="text"
              value={formData.customerTaxNumber}
              onChange={(e) =>
                setFormData({ ...formData, customerTaxNumber: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
        </div>
      </div>

      {/* Invoice Items */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold mb-4">
          Postavke / Invoice Items
        </h4>

        <div className="space-y-4">
          {formData.items.map((item, index) => (
            <div key={index} className="grid grid-cols-12 gap-2 items-end">
              <div className="col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opis / Description
                </label>
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(index, 'description', e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                  placeholder="Nočitev, Zajtrk, itd."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Količina / Qty
                </label>
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(index, 'quantity', Number(e.target.value))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enota / Unit
                </label>
                <select
                  value={item.unit}
                  onChange={(e) => updateItem(index, 'unit', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="kos">kos</option>
                  <option value="noc">noč</option>
                  <option value="dan">dan</option>
                  <option value="ura">ura</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cena / Price
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(e) =>
                    updateItem(index, 'unitPrice', Number(e.target.value))
                  }
                  className="w-full border border-gray-300 rounded-md px-3 py-2"
                />
              </div>

              <div className="col-span-1">
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-600 hover:text-red-800 text-xl"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addItem}
          className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          + Dodaj postavko / Add Item
        </button>
      </div>

      {/* Payment Terms */}
      <div className="bg-white rounded-lg shadow p-6">
        <h4 className="text-lg font-semibold mb-4">
          Plačilni pogoji / Payment Terms
        </h4>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rok plačila (dni) / Payment Terms (days)
            </label>
            <input
              type="number"
              value={formData.paymentTerms}
              onChange={(e) =>
                setFormData({ ...formData, paymentTerms: Number(e.target.value) })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opombe / Notes
            </label>
            <input
              type="text"
              value={formData.customerNotes}
              onChange={(e) =>
                setFormData({ ...formData, customerNotes: e.target.value })
              }
              className="w-full border border-gray-300 rounded-md px-3 py-2"
              placeholder="Hvala za gostovanje..."
            />
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Medvsota / Subtotal:</span>
              <span className="font-medium">€{totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">DDV / VAT:</span>
              <span className="font-medium">€{totals.vat.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold border-t pt-2">
              <span>Skupaj / Total:</span>
              <span>€{totals.total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={calculateTotals}
          disabled={calculating}
          className="mt-4 text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {calculating ? 'Izračunavam...' : 'Preračunaj z davki / Recalculate with Taxes'}
        </button>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4">
        <button
          type="submit"
          className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700"
        >
          Shrni osnutek / Save Draft
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          className="flex-1 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700"
        >
          Izdaj račun / Issue Invoice
        </button>
      </div>
    </form>
  );
}
