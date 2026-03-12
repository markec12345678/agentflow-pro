'use client';

/**
 * Approval Queue Component
 * Displays pending approvals for human-in-the-loop workflow
 */

import { useState, useEffect } from 'react';

interface ApprovalRequest {
  id: string;
  agentId: string;
  action: string;
  description: string;
  inputData: any;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  requestedAt: string;
  expiresAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
}

interface ApprovalStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  totalExpired: number;
  avgReviewTimeMinutes: number;
}

export function ApprovalQueue() {
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [stats, setStats] = useState<ApprovalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  // Fetch pending approvals
  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/agents/approvals?status=pending');
      const data = await response.json();
      if (data.success) {
        setApprovals(data.data);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch approvals:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // Poll every 30 seconds
    const interval = setInterval(fetchApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  // Respond to approval
  const respondToApproval = async (approvalId: string, approved: boolean) => {
    setProcessing(approvalId);
    try {
      const response = await fetch('/api/agents/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'respond',
          approvalId,
          approved,
          notes: reviewNotes,
          reviewedBy: 'current-user', // Would be actual user ID
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Remove from list
        setApprovals(prev => prev.filter(a => a.id !== approvalId));
        setSelectedApproval(null);
        setReviewNotes('');
      }
    } catch (error) {
      console.error('Failed to respond to approval:', error);
    } finally {
      setProcessing(null);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getTimeUntilExpiry = (expiresAt: string) => {
    const expires = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = expires - now;
    
    if (diff <= 0) return 'Expired';
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m remaining`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m remaining`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">🔐 Approval Queue</h1>
        <p className="text-gray-600">
          Review and approve agent actions requiring human oversight
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalPending}</div>
            <div className="text-sm text-blue-800">Pending</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{stats.totalApproved}</div>
            <div className="text-sm text-green-800">Approved</div>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.totalRejected}</div>
            <div className="text-sm text-red-800">Rejected</div>
          </div>
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-600">
              {Math.round(stats.avgReviewTimeMinutes)}m
            </div>
            <div className="text-sm text-gray-800">Avg Review Time</div>
          </div>
        </div>
      )}

      {/* Approval List */}
      <div className="space-y-4">
        {approvals.length === 0 ? (
          <div className="text-center p-12 bg-gray-50 rounded-lg">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="text-lg font-semibold mb-2">No Pending Approvals</h3>
            <p className="text-gray-600">All agent actions have been reviewed</p>
          </div>
        ) : (
          approvals.map(approval => (
            <div
              key={approval.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{approval.agentId}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(approval.riskLevel)}`}>
                      {approval.riskLevel.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">{approval.description}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">
                    Expires: {getTimeUntilExpiry(approval.expiresAt)}
                  </div>
                  <button
                    onClick={() => setSelectedApproval(approval)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Review →
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Action: {approval.action}</span>
                <span>•</span>
                <span>Requested: {new Date(approval.requestedAt).toLocaleString()}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold mb-1">
                    Review Approval Request
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedApproval.agentId}</span>
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${getRiskColor(selectedApproval.riskLevel)}`}>
                      {selectedApproval.riskLevel.toUpperCase()} RISK
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedApproval(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Details */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-sm font-medium text-gray-700">Action</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded border">
                    {selectedApproval.action}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <div className="mt-1 p-3 bg-gray-50 rounded border">
                    {selectedApproval.description}
                  </div>
                </div>

                {selectedApproval.inputData && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Input Data</label>
                    <pre className="mt-1 p-3 bg-gray-50 rounded border text-xs overflow-auto max-h-40">
                      {JSON.stringify(selectedApproval.inputData, null, 2)}
                    </pre>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Review Notes (optional)
                  </label>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    className="mt-1 w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    placeholder="Add any notes about this decision..."
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => respondToApproval(selectedApproval.id, false)}
                  disabled={processing === selectedApproval.id}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
                >
                  {processing === selectedApproval.id ? 'Processing...' : '❌ Reject'}
                </button>
                <button
                  onClick={() => respondToApproval(selectedApproval.id, true)}
                  disabled={processing === selectedApproval.id}
                  className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-medium"
                >
                  {processing === selectedApproval.id ? 'Processing...' : '✅ Approve'}
                </button>
              </div>

              {/* Warning for high risk */}
              {(selectedApproval.riskLevel === 'high' || selectedApproval.riskLevel === 'critical') && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <span className="text-amber-600">⚠️</span>
                    <div className="text-sm text-amber-800">
                      <strong>High Risk Action:</strong> This action has been flagged as{' '}
                      {selectedApproval.riskLevel} risk. Please review carefully before approving.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ApprovalQueue;
