"use client";

import { useState, useEffect } from "react";
import { logger } from '@/infrastructure/observability/logger';
import { 
  FileText, 
  Calendar, 
  Download, 
  Share2, 
  Plus, 
  Filter, 
  Clock, 
  Mail, 
  Settings, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Hotel, 
  DollarSign, 
  CheckCircle, 
  Edit, 
  Trash2, 
  Copy, 
  Eye,
  Send,
  Building,
  ArrowRightLeft,
  CalendarDays
} from "lucide-react";

// Types
interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: "daily" | "weekly" | "monthly" | "custom";
  category: "revenue" | "occupancy" | "performance" | "comparison";
  metrics: string[];
  properties: string[];
  enabled: boolean;
  schedule?: {
    enabled: boolean;
    frequency: "daily" | "weekly" | "monthly";
    recipients: string[];
    time: string;
  };
}

interface GeneratedReport {
  id: string;
  templateId: string;
  name: string;
  generatedAt: string;
  period: {
    start: string;
    end: string;
  };
  status: "generating" | "completed" | "failed";
  fileUrl?: string;
  fileSize?: number;
  errorMessage?: string;
}

interface ReportBuilder {
  name: string;
  description: string;
  metrics: string[];
  properties: string[];
  dateRange: {
    start: Date;
    end: Date;
  };
  comparison: {
    enabled: boolean;
    previousPeriod: boolean;
    yearOverYear: boolean;
  };
  format: "pdf" | "csv" | "excel";
}

export default function ReportsPage() {
  const [templates, setTemplates] = useState<ReportTemplate[]>([
    {
      id: "daily-revenue",
      name: "Daily Revenue Report",
      description: "Daily revenue and occupancy summary",
      type: "daily",
      category: "revenue",
      metrics: ["revenue", "occupancy", "adr", "revpar"],
      properties: ["all"],
      enabled: true,
      schedule: {
        enabled: true,
        frequency: "daily",
        recipients: ["director@company.com", "manager@company.com"],
        time: "08:00"
      }
    },
    {
      id: "weekly-performance",
      name: "Weekly Performance Report",
      description: "Comprehensive weekly performance metrics",
      type: "weekly",
      category: "performance",
      metrics: ["revenue", "occupancy", "adr", "revpar", "booking_channels", "guest_demographics"],
      properties: ["all"],
      enabled: true,
      schedule: {
        enabled: true,
        frequency: "weekly",
        recipients: ["director@company.com"],
        time: "09:00"
      }
    },
    {
      id: "monthly-summary",
      name: "Monthly Summary Report",
      description: "Detailed monthly business summary",
      type: "monthly",
      category: "revenue",
      metrics: ["revenue", "occupancy", "adr", "revpar", "channel_breakdown", "demographics"],
      properties: ["all"],
      enabled: true,
      schedule: {
        enabled: true,
        frequency: "monthly",
        recipients: ["director@company.com", "investors@company.com"],
        time: "10:00"
      }
    },
    {
      id: "property-comparison",
      name: "Property Comparison Report",
      description: "Multi-property performance comparison",
      type: "custom",
      category: "comparison",
      metrics: ["revenue", "occupancy", "adr", "revpar"],
      properties: ["property1", "property2", "property3"],
      enabled: false
    }
  ]);

  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([
    {
      id: "1",
      templateId: "daily-revenue",
      name: "Daily Revenue Report",
      generatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      period: {
        start: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      status: "completed",
      fileUrl: "/reports/daily-revenue-2026-03-01.pdf",
      fileSize: 245760
    },
    {
      id: "2",
      templateId: "weekly-performance",
      name: "Weekly Performance Report",
      generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      status: "completed",
      fileUrl: "/reports/weekly-performance-2026-w09.pdf",
      fileSize: 524288
    },
    {
      id: "3",
      templateId: "monthly-summary",
      name: "Monthly Summary Report",
      generatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      period: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      },
      status: "failed",
      errorMessage: "Failed to generate report: Data processing error"
    }
  ]);

  const [showBuilder, setShowBuilder] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [generating, setGenerating] = useState<string | null>(null);
  const [builderData, setBuilderData] = useState<ReportBuilder>({
    name: "",
    description: "",
    metrics: [],
    properties: [],
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    },
    comparison: {
      enabled: false,
      previousPeriod: false,
      yearOverYear: false
    },
    format: "pdf"
  });

  const availableMetrics = [
    { id: "revenue", name: "Revenue", icon: DollarSign },
    { id: "occupancy", name: "Occupancy", icon: Hotel },
    { id: "adr", name: "ADR", icon: TrendingUp },
    { id: "revpar", name: "RevPAR", icon: BarChart3 },
    { id: "booking_channels", name: "Booking Channels", icon: Users },
    { id: "guest_demographics", name: "Guest Demographics", icon: Users },
    { id: "auto_approval_rate", name: "Auto-approval Rate", icon: CheckCircle }
  ];

  const availableProperties = [
    { id: "all", name: "All Properties" },
    { id: "property1", name: "Hotel Alpina" },
    { id: "property2", name: "Vila Marija" },
    { id: "property3", name: "Apartmaji Jezero" },
    { id: "property4", name: "Kamp Sončni Gaj" }
  ];

  const handleGenerateReport = async (templateId: string) => {
    setGenerating(templateId);
    
    // Simulate report generation
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const newReport: GeneratedReport = {
      id: Date.now().toString(),
      templateId,
      name: templates.find(t => t.id === templateId)?.name || "Custom Report",
      generatedAt: new Date().toISOString(),
      period: {
        start: new Date().toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0]
      },
      status: Math.random() > 0.2 ? "completed" : "failed",
      fileUrl: Math.random() > 0.2 ? `/reports/${templateId}-${Date.now()}.pdf` : undefined,
      fileSize: Math.random() > 0.2 ? Math.floor(100000 + Math.random() * 900000) : undefined,
      errorMessage: Math.random() > 0.2 ? undefined : "Failed to generate report: Server error"
    };

    setGeneratedReports(prev => [newReport, ...prev.slice(0, 9)]);
    setGenerating(null);
  };

  const handleCreateCustomReport = async () => {
    setGenerating("custom");
    
    // Simulate custom report generation
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    const newReport: GeneratedReport = {
      id: Date.now().toString(),
      templateId: "custom",
      name: builderData.name || "Custom Report",
      generatedAt: new Date().toISOString(),
      period: {
        start: builderData.dateRange.start.toISOString().split('T')[0],
        end: builderData.dateRange.end.toISOString().split('T')[0]
      },
      status: "completed",
      fileUrl: `/reports/custom-${Date.now()}.pdf`,
      fileSize: Math.floor(200000 + Math.random() * 800000)
    };

    setGeneratedReports(prev => [newReport, ...prev.slice(0, 9)]);
    setGenerating(null);
    setShowBuilder(false);
    setBuilderData({
      name: "",
      description: "",
      metrics: [],
      properties: [],
      dateRange: {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        end: new Date()
      },
      comparison: {
        enabled: false,
        previousPeriod: false,
        yearOverYear: false
      },
      format: "pdf"
    });
  };

  const handleToggleTemplate = (templateId: string) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, enabled: !template.enabled }
        : template
    ));
  };

  const handleUpdateSchedule = (templateId: string, schedule: any) => {
    setTemplates(prev => prev.map(template => 
      template.id === templateId 
        ? { ...template, schedule }
        : template
    ));
  };

  const handleDownloadReport = (report: GeneratedReport) => {
    logger.info(`Downloading report: ${report.name}`);
    // Simulate download
    const link = document.createElement('a');
    link.href = report.fileUrl || '#';
    link.download = `${report.name.replace(/\s+/g, '_')}.pdf`;
    link.click();
  };

  const handleShareReport = (report: GeneratedReport) => {
    logger.info(`Sharing report: ${report.name}`);
    // Simulate share functionality
    if (navigator.share) {
      navigator.share({
        title: report.name,
        text: `Check out this report: ${report.name}`,
        url: window.location.origin + report.fileUrl
      });
    } else {
      // Fallback - copy to clipboard
      navigator.clipboard.writeText(window.location.origin + report.fileUrl);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "revenue": return <DollarSign className="w-4 h-4" />;
      case "occupancy": return <Hotel className="w-4 h-4" />;
      case "performance": return <BarChart3 className="w-4 h-4" />;
      case "comparison": return <ArrowRightLeft className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed": return <Trash2 className="w-4 h-4 text-red-500" />;
      case "generating": return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-blue-500" />
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Report Generator</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowBuilder(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Custom Report</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Report Templates */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Report Templates</h2>
              
              <div className="space-y-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                          {getCategoryIcon(template.category)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium text-gray-900 dark:text-white">
                              {template.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs rounded-full border ${
                              template.type === "daily" ? "bg-blue-50 text-blue-800 border-blue-200" :
                              template.type === "weekly" ? "bg-green-50 text-green-800 border-green-200" :
                              template.type === "monthly" ? "bg-purple-50 text-purple-800 border-purple-200" :
                              "bg-orange-50 text-orange-800 border-orange-200"
                            }`}>
                              {template.type}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {template.description}
                          </p>
                          
                          <div className="flex flex-wrap gap-2 mt-2">
                            {template.metrics.map((metric) => {
                              const metricInfo = availableMetrics.find(m => m.id === metric);
                              return (
                                <span
                                  key={metric}
                                  className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded"
                                >
                                  {metricInfo?.name || metric}
                                </span>
                              );
                            })}
                          </div>

                          {template.schedule && (
                            <div className="mt-3 flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                              <Calendar className="w-3 h-3" />
                              <span>
                                Auto-send: {template.schedule.frequency} at {template.schedule.time}
                              </span>
                              <span>•</span>
                              <span>{template.schedule.recipients.length} recipients</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => handleGenerateReport(template.id)}
                          disabled={generating === template.id}
                          className="flex items-center space-x-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors text-sm"
                        >
                          {generating === template.id ? (
                            <>
                              <Clock className="w-4 h-4 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="w-4 h-4" />
                              <span>Generate</span>
                            </>
                          )}
                        </button>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleToggleTemplate(template.id)}
                            className={`p-2 rounded ${
                              template.enabled 
                                ? "bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400" 
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {template.enabled ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                          </button>
                          
                          <button
                            onClick={() => setSelectedTemplate(selectedTemplate === template.id ? null : template.id)}
                            aria-label="Configure template"
                            title="Configure report template"
                            className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Template Settings */}
                    {selectedTemplate === template.id && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Schedule Settings</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-700 dark:text-gray-300">Enable auto-send</span>
                            <button
                              onClick={() => handleUpdateSchedule(template.id, {
                                ...template.schedule,
                                enabled: !template.schedule?.enabled
                              })}
                              aria-label={template.schedule?.enabled ? "Disable auto-send" : "Enable auto-send"}
                              title={template.schedule?.enabled ? "Disable auto-send for this report" : "Enable auto-send for this report"}
                              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                template.schedule?.enabled ? "bg-blue-500" : "bg-gray-300 dark:bg-gray-600"
                              }`}
                            >
                              <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                                  template.schedule?.enabled ? "translate-x-5" : "translate-x-1"
                                }`}
                              />
                            </button>
                          </div>
                          
                          {template.schedule?.enabled && (
                            <>
                              <div>
                                <label className="text-sm text-gray-700 dark:text-gray-300">Frequency</label>
                                <select
                                  value={template.schedule.frequency}
                                  onChange={(e) => handleUpdateSchedule(template.id, {
                                    ...template.schedule,
                                    frequency: e.target.value as any
                                  })}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                  aria-label="Report frequency"
                                  title="Select report generation frequency"
                                >
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="monthly">Monthly</option>
                                </select>
                              </div>
                              
                              <div>
                                <label className="text-sm text-gray-700 dark:text-gray-300">Time</label>
                                <input
                                  type="time"
                                  value={template.schedule.time}
                                  onChange={(e) => handleUpdateSchedule(template.id, {
                                    ...template.schedule,
                                    time: e.target.value
                                  })}
                                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                                  placeholder="Select time"
                                  aria-label="Report time"
                                  title="Select time for report generation"
                                />
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Generated Reports */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Generated Reports</h2>
              
              {generatedReports.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  No reports generated yet. Generate a report to see it here.
                </p>
              ) : (
                <div className="space-y-3">
                  {generatedReports.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {getStatusIcon(report.status)}
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white text-sm">
                              {report.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {new Date(report.generatedAt).toLocaleString("sl-SI")}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {report.period.start} - {report.period.end}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {report.status === "completed" && (
                            <>
                              {report.fileSize && (
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatFileSize(report.fileSize)}
                                </span>
                              )}
                              <button
                                onClick={() => handleDownloadReport(report)}
                                className="p-1 text-blue-500 hover:text-blue-700"
                                title="Download"
                              >
                                <Download className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleShareReport(report)}
                                className="p-1 text-green-500 hover:text-green-700"
                                title="Share"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {report.status === "failed" && (
                            <span className="text-xs text-red-600 dark:text-red-400">
                              {report.errorMessage}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Quick Stats</h2>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Total Reports</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {generatedReports.length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Active Templates</span>
                  <span className="font-medium text-green-600">
                    {templates.filter(t => t.enabled).length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Scheduled Reports</span>
                  <span className="font-medium text-blue-600">
                    {templates.filter(t => t.schedule?.enabled).length}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Failed Reports</span>
                  <span className="font-medium text-red-600">
                    {generatedReports.filter(r => r.status === "failed").length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Report Builder Modal */}
      {showBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Custom Report Builder</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Report Name
                </label>
                <input
                  type="text"
                  value={builderData.name}
                  onChange={(e) => setBuilderData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter report name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={builderData.description}
                  onChange={(e) => setBuilderData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Enter report description"
                />
              </div>

              {/* Metrics Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Metrics
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {availableMetrics.map((metric) => (
                    <label
                      key={metric.id}
                      className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={builderData.metrics.includes(metric.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBuilderData(prev => ({ 
                              ...prev, 
                              metrics: [...prev.metrics, metric.id] 
                            }));
                          } else {
                            setBuilderData(prev => ({ 
                              ...prev, 
                              metrics: prev.metrics.filter(m => m !== metric.id) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {metric.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Properties Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Properties
                </label>
                <div className="space-y-2">
                  {availableProperties.map((property) => (
                    <label
                      key={property.id}
                      className="flex items-center space-x-2 p-2 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <input
                        type="checkbox"
                        checked={builderData.properties.includes(property.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBuilderData(prev => ({ 
                              ...prev, 
                              properties: [...prev.properties, property.id] 
                            }));
                          } else {
                            setBuilderData(prev => ({ 
                              ...prev, 
                              properties: prev.properties.filter(p => p !== property.id) 
                            }));
                          }
                        }}
                        className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {property.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">Start Date</label>
                    <input
                      type="date"
                      value={builderData.dateRange.start.toISOString().split('T')[0]}
                      onChange={(e) => setBuilderData(prev => ({ 
                        ...prev, 
                        dateRange: { 
                          ...prev.dateRange, 
                          start: new Date(e.target.value) 
                        } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Select start date"
                      aria-label="Start date"
                      title="Select report start date"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400">End Date</label>
                    <input
                      type="date"
                      value={builderData.dateRange.end.toISOString().split('T')[0]}
                      onChange={(e) => setBuilderData(prev => ({ 
                        ...prev, 
                        dateRange: { 
                          ...prev.dateRange, 
                          end: new Date(e.target.value) 
                        } 
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white text-sm"
                      placeholder="Select end date"
                      aria-label="End date"
                      title="Select report end date"
                    />
                  </div>
                </div>
              </div>

              {/* Comparison Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Comparison Options
                </label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={builderData.comparison.enabled}
                      onChange={(e) => setBuilderData(prev => ({ 
                        ...prev, 
                        comparison: { ...prev.comparison, enabled: e.target.checked }
                      }))}
                      className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Enable comparison</span>
                  </label>
                  
                  {builderData.comparison.enabled && (
                    <>
                      <label className="flex items-center space-x-2 ml-6">
                        <input
                          type="checkbox"
                          checked={builderData.comparison.previousPeriod}
                          onChange={(e) => setBuilderData(prev => ({ 
                            ...prev, 
                            comparison: { ...prev.comparison, previousPeriod: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Previous period</span>
                      </label>
                      
                      <label className="flex items-center space-x-2 ml-6">
                        <input
                          type="checkbox"
                          checked={builderData.comparison.yearOverYear}
                          onChange={(e) => setBuilderData(prev => ({ 
                            ...prev, 
                            comparison: { ...prev.comparison, yearOverYear: e.target.checked }
                          }))}
                          className="rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Year-over-year</span>
                      </label>
                    </>
                  )}
                </div>
              </div>

              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Export Format
                </label>
                <div className="flex space-x-4">
                  {["pdf", "csv", "excel"].map((format) => (
                    <label key={format} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="format"
                        value={format}
                        checked={builderData.format === format}
                        onChange={(e) => setBuilderData(prev => ({ ...prev, format: e.target.value as any }))}
                        className="text-blue-500 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300 uppercase">{format}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowBuilder(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateCustomReport}
                disabled={generating === "custom" || !builderData.name || builderData.metrics.length === 0}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
              >
                {generating === "custom" ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin inline mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="w-4 h-4 inline mr-2" />
                    Generate Report
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
