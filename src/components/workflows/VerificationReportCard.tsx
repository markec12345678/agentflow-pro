'use client';

import React, { useState } from 'react';
import { VerificationReport, VerificationIssue } from '../../agents/verification/VerifierAgent';
import { CheckCircle, XCircle, AlertTriangle, Info, ChevronDown, ChevronUp, Shield, RefreshCw, UserCheck } from 'lucide-react';

interface VerificationReportCardProps {
  report: VerificationReport;
  onRetry?: () => Promise<void>;
  onApprove?: () => Promise<void>;
  onRequestReview?: () => Promise<void>;
}

export const VerificationReportCard: React.FC<VerificationReportCardProps> = ({
  report,
  onRetry,
  onApprove,
  onRequestReview,
}) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    scores: true,
    issues: true,
    evidence: false,
    recommendations: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100';
    if (confidence >= 0.6) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-700 bg-red-100 border-red-300';
      case 'high': return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'medium': return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      case 'low': return 'text-blue-700 bg-blue-100 border-blue-300';
      default: return 'text-gray-700 bg-gray-100 border-gray-300';
    }
  };

  const getIssueIcon = (type: string) => {
    switch (type) {
      case 'hallucination': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'factual_error': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'inconsistency': return <RefreshCw className="w-4 h-4 text-yellow-600" />;
      case 'constraint_violation': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'incomplete': return <Info className="w-4 h-4 text-blue-600" />;
      default: return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  const ScoreBar: React.FC<{ label: string; score: number }> = ({ label, score }) => (
    <div className="mb-3">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className={`text-sm font-bold ${getConfidenceColor(score)}`}>
          {(score * 100).toFixed(0)}%
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all ${getConfidenceBg(score)}`}
          style={{ width: `${score * 100}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`px-6 py-4 border-b ${report.passed ? 'bg-green-50 border-green-200' : report.requiresHumanReview ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {report.passed ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : report.requiresHumanReview ? (
              <AlertTriangle className="w-6 h-6 text-red-600" />
            ) : (
              <RefreshCw className="w-6 h-6 text-yellow-600" />
            )}
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Verification Report
              </h3>
              <p className="text-sm text-gray-600">
                ID: {report.id}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-full ${getConfidenceBg(report.overallConfidence)}`}>
            <div className="text-center">
              <div className={`text-2xl font-bold ${getConfidenceColor(report.overallConfidence)}`}>
                {(report.overallConfidence * 100).toFixed(0)}%
              </div>
              <div className="text-xs text-gray-600">Confidence</div>
            </div>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className={`px-6 py-3 ${report.passed ? 'bg-green-100' : report.requiresHumanReview ? 'bg-red-100' : 'bg-yellow-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Shield className={`w-5 h-5 ${report.passed ? 'text-green-700' : report.requiresHumanReview ? 'text-red-700' : 'text-yellow-700'}`} />
            <span className={`font-medium ${report.passed ? 'text-green-800' : report.requiresHumanReview ? 'text-red-800' : 'text-yellow-800'}`}>
              {report.passed ? '✓ Verification Passed' : report.requiresHumanReview ? '⚠ Requires Human Review' : '⚡ Revision Recommended'}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            {onRetry && !report.passed && (
              <button
                onClick={onRetry}
                className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-1" />
                Retry
              </button>
            )}
            {onApprove && report.passed && (
              <button
                onClick={onApprove}
                className="px-3 py-1 bg-green-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                <UserCheck className="w-4 h-4 inline mr-1" />
                Approve
              </button>
            )}
            {onRequestReview && report.requiresHumanReview && (
              <button
                onClick={onRequestReview}
                className="px-3 py-1 bg-red-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-red-700 transition-colors"
              >
                <UserCheck className="w-4 h-4 inline mr-1" />
                Request Review
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Overview Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('overview')}
            className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <span className="font-semibold text-gray-800">Overview</span>
            {expandedSections.overview ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.overview && (
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-600">Plan ID</div>
                  <div className="font-mono text-sm">{report.planId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Execution ID</div>
                  <div className="font-mono text-sm">{report.executionId}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Timestamp</div>
                  <div className="text-sm">{report.timestamp.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-600">Verification Duration</div>
                  <div className="text-sm">{report.metadata.verificationDuration}ms</div>
                </div>
              </div>
              <div className="pt-3 border-t">
                <div className="text-sm text-gray-600 mb-2">Checks Performed</div>
                <div className="flex flex-wrap gap-2">
                  {report.metadata.checksPerformed.map(check => (
                    <span key={check} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                      {check}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scores Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('scores')}
            className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <span className="font-semibold text-gray-800">Detailed Scores</span>
            {expandedSections.scores ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.scores && (
            <div className="p-4">
              <ScoreBar label="Plan Alignment" score={report.scores.planAlignment} />
              <ScoreBar label="Factual Accuracy" score={report.scores.factualAccuracy} />
              <ScoreBar label="Consistency" score={report.scores.consistency} />
              <ScoreBar label="Completeness" score={report.scores.completeness} />
              <ScoreBar label="Quality" score={report.scores.quality} />
            </div>
          )}
        </div>

        {/* Issues Section */}
        {report.issues.length > 0 && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('issues')}
              className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
              <span className="font-semibold text-gray-800 flex items-center">
                Issues Found
                <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 text-xs rounded-full">
                  {report.issues.length}
                </span>
              </span>
              {expandedSections.issues ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.issues && (
              <div className="p-4 space-y-3">
                {report.issues.map((issue, index) => (
                  <div
                    key={index}
                    className={`p-4 border-l-4 rounded ${getSeverityColor(issue.severity)}`}
                  >
                    <div className="flex items-start space-x-2">
                      {getIssueIcon(issue.type)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold capitalize">{issue.type.replace('_', ' ')}</span>
                          <span className="px-2 py-0.5 bg-white bg-opacity-50 rounded text-xs capitalize">
                            {issue.severity}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{issue.description}</p>
                        <div className="bg-white bg-opacity-50 rounded p-2 mb-2">
                          <div className="text-xs font-medium mb-1">Evidence:</div>
                          <pre className="text-xs whitespace-pre-wrap">{issue.evidence}</pre>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">Suggestion:</span> {issue.suggestion}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Evidence Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('evidence')}
            className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <span className="font-semibold text-gray-800">Evidence</span>
            {expandedSections.evidence ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.evidence && (
            <div className="p-4 space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">
                  Matched Requirements ({report.evidence.matchedRequirements.length})
                </div>
                {report.evidence.matchedRequirements.length > 0 ? (
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                    {report.evidence.matchedRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-gray-500 italic">No requirements matched</div>
                )}
              </div>
              {report.evidence.missedRequirements.length > 0 && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">
                    Missed Requirements ({report.evidence.missedRequirements.length})
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-red-600">
                    {report.evidence.missedRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recommendations Section */}
        <div className="border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => toggleSection('recommendations')}
            className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
          >
            <span className="font-semibold text-gray-800">Recommendations</span>
            {expandedSections.recommendations ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
          {expandedSections.recommendations && (
            <div className="p-4">
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">Recommended Action</div>
                <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                  report.recommendations.action === 'accept' ? 'bg-green-100 text-green-800' :
                  report.recommendations.action === 'retry' ? 'bg-yellow-100 text-yellow-800' :
                  report.recommendations.action === 'human_review' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {report.recommendations.action.replace('_', ' ').toUpperCase()}
                </div>
              </div>
              <div className="mb-4">
                <div className="text-sm text-gray-600 mb-1">Reason</div>
                <p className="text-sm text-gray-800">{report.recommendations.reason}</p>
              </div>
              {report.recommendations.suggestedChanges && report.recommendations.suggestedChanges.length > 0 && (
                <div>
                  <div className="text-sm text-gray-600 mb-2">Suggested Changes</div>
                  <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
                    {report.recommendations.suggestedChanges.map((change, i) => (
                      <li key={i}>{change}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerificationReportCard;
