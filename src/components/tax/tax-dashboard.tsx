/**
 * Tax Dashboard Widget
 * 
 * Displays tax summary for current month on dashboard.
 * Shows tourist tax, VAT, and filing deadlines.
 */

'use client';

import React, { useEffect, useState } from 'react';

interface TaxWidgetData {
  currentMonth: {
    touristTax: number;
    vat: number;
    totalToRemit: number;
    nights: number;
    guests: number;
  };
  nextDeadline: {
    type: string;
    date: string;
    daysRemaining: number;
  } | null;
  pendingReports: number;
}

export function TaxDashboardWidget({ propertyId }: { propertyId: string }) {
  const [data, setData] = useState<TaxWidgetData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTaxData() {
      try {
        const response = await fetch(`/api/tax/dashboard?propertyId=${propertyId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch tax data');
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchTaxData();
  }, [propertyId]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Davki / Taxes</h3>
        <div className="text-red-600 text-sm">{error}</div>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Davki / Taxes</h3>
        <a
          href="/dashboard/tax"
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          View All →
        </a>
      </div>

      {/* Current Month Summary */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">
            Turistična taksa / Tourist Tax
          </div>
          <div className="text-2xl font-bold text-blue-700">
            €{data.currentMonth.touristTax.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {data.currentMonth.nights} noči / {data.currentMonth.guests} gostov
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4">
          <div className="text-sm text-gray-600 mb-1">DDV / VAT</div>
          <div className="text-2xl font-bold text-green-700">
            €{data.currentMonth.vat.toFixed(2)}
          </div>
          <div className="text-xs text-gray-500 mt-1">
            Osnova: €{(data.currentMonth.vat / 0.22).toFixed(0)}
          </div>
        </div>
      </div>

      {/* Total to Remit */}
      <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-600">Skupaj za plačilo / Total to Remit</div>
            <div className="text-xl font-bold text-yellow-700">
              €{data.currentMonth.totalToRemit.toFixed(2)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-gray-500">Ta mesec / This Month</div>
          </div>
        </div>
      </div>

      {/* Next Deadline */}
      {data.nextDeadline && (
        <div className="bg-red-50 border-l-4 border-red-400 rounded-lg p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Naslednji rok / Next Deadline</div>
              <div className="text-lg font-semibold text-red-700">
                {data.nextDeadline.type}
              </div>
              <div className="text-xs text-gray-500">
                {new Date(data.nextDeadline.date).toLocaleDateString('sl-SI')}
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600">
                {data.nextDeadline.daysRemaining}
              </div>
              <div className="text-xs text-gray-500">dni / days</div>
            </div>
          </div>
        </div>
      )}

      {/* Pending Reports */}
      {data.pendingReports > 0 && (
        <div className="bg-orange-50 border-l-4 border-orange-400 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Nepredložena poročila / Pending Reports
            </div>
            <div className="text-lg font-bold text-orange-700">
              {data.pendingReports}
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2">
        <button
          onClick={() => (window.location.href = '/dashboard/tax/reports')}
          className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
        >
          Ustvari poročilo
        </button>
        <button
          onClick={() => (window.location.href = '/dashboard/invoices')}
          className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
        >
          Izdaj račun
        </button>
      </div>
    </div>
  );
}

/**
 * Tax Report List Component
 */

interface TaxReport {
  id: string;
  month: number;
  year: number;
  touristTaxAmount: number;
  vatAmount: number;
  totalToRemit: number;
  status: 'draft' | 'submitted' | 'paid';
  submittedAt?: string;
}

export function TaxReportList({ propertyId }: { propertyId: string }) {
  const [reports, setReports] = useState<TaxReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReports() {
      try {
        const response = await fetch(`/api/tax/reports?propertyId=${propertyId}`);
        const result = await response.json();
        setReports(result.reports);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchReports();
  }, [propertyId]);

  const getStatusBadge = (status: string) => {
    const badges: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-700',
      submitted: 'bg-blue-100 text-blue-700',
      paid: 'bg-green-100 text-green-700',
    };
    return badges[status] || badges.draft;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Osnutek / Draft',
      submitted: 'Predloženo / Submitted',
      paid: 'Plačano / Paid',
    };
    return labels[status] || status;
  };

  if (loading) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">
          Davčna poročila / Tax Reports
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Obdobje / Period
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Turistična taksa
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                DDV / VAT
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Skupaj / Total
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Akcije / Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {reports.map((report) => (
              <tr key={report.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {report.month}.{report.year}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                  €{report.touristTaxAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-700">
                  €{report.vatAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-gray-900">
                  €{report.totalToRemit.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(
                      report.status
                    )}`}
                  >
                    {getStatusLabel(report.status)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    className="text-blue-600 hover:text-blue-900 mr-3"
                    onClick={() => (window.location.href = `/dashboard/tax/reports/${report.id}`)}
                  >
                    Ogled / View
                  </button>
                  {report.status === 'draft' && (
                    <button className="text-green-600 hover:text-green-900">
                      Predloži / Submit
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {reports.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          Ni poročil / No reports found
        </div>
      )}
    </div>
  );
}
