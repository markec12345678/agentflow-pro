/**
 * Template Selector Component
 * 
 * UI component for selecting and previewing templates
 * Supports all 8 template systems
 * 
 * Usage:
 * ```tsx
 * <TemplateSelector
 *   system="email"
 *   onTemplateSelect={(template) => handleSelect(template)}
 * />
 * ```
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  EMAIL_TEMPLATES,
  WORKFLOW_TEMPLATES,
  AI_PROMPT_TEMPLATES,
  SMS_TEMPLATES,
  NOTIFICATION_TEMPLATES,
  REPORT_TEMPLATES,
  DOCUMENT_TEMPLATES,
  WIDGET_TEMPLATES,
  DASHBOARD_TEMPLATES,
  type EmailTemplate,
  type WorkflowTemplate,
  type AIPromptTemplate,
  type MessageTemplate,
  type NotificationTemplate,
  type ReportTemplate,
  type DocumentTemplate
} from '@/lib/templates';

// ============================================================================
// TYPES
// ============================================================================

type TemplateSystem =
  | 'email'
  | 'workflow'
  | 'ai_prompt'
  | 'sms'
  | 'notification'
  | 'report'
  | 'document'
  | 'dashboard';

interface TemplateSelectorProps {
  system?: TemplateSystem;
  onTemplateSelect?: (template: any, system: TemplateSystem) => void;
  showPreview?: boolean;
  showStats?: boolean;
  className?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  system,
  onTemplateSelect,
  showPreview = true,
  showStats = true,
  className = ''
}) => {
  const [selectedSystem, setSelectedSystem] = useState<TemplateSystem>(system || 'email');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Get templates for selected system
  const templates = useMemo(() => {
    switch (selectedSystem) {
      case 'email':
        return Object.values(EMAIL_TEMPLATES);
      case 'workflow':
        return Object.values(WORKFLOW_TEMPLATES);
      case 'ai_prompt':
        return Object.values(AI_PROMPT_TEMPLATES);
      case 'sms':
        return Object.values(SMS_TEMPLATES);
      case 'notification':
        return Object.values(NOTIFICATION_TEMPLATES);
      case 'report':
        return Object.values(REPORT_TEMPLATES);
      case 'document':
        return Object.values(DOCUMENT_TEMPLATES);
      case 'dashboard':
        return Object.values(DASHBOARD_TEMPLATES);
      default:
        return [];
    }
  }, [selectedSystem]);

  // Filter templates by search query
  const filteredTemplates = useMemo(() => {
    if (!searchQuery) return templates;
    
    const query = searchQuery.toLowerCase();
    return templates.filter(template =>
      template.name.toLowerCase().includes(query) ||
      template.id.toLowerCase().includes(query) ||
      (template.description && template.description.toLowerCase().includes(query))
    );
  }, [templates, searchQuery]);

  // Handle template selection
  const handleTemplateClick = (template: any) => {
    setSelectedTemplate(template);
    onTemplateSelect?.(template, selectedSystem);
  };

  // Get system stats
  const getSystemStats = () => {
    return {
      email: Object.keys(EMAIL_TEMPLATES).length,
      workflow: Object.keys(WORKFLOW_TEMPLATES).length,
      ai_prompt: Object.keys(AI_PROMPT_TEMPLATES).length,
      sms: Object.keys(SMS_TEMPLATES).length,
      notification: Object.keys(NOTIFICATION_TEMPLATES).length,
      report: Object.keys(REPORT_TEMPLATES).length,
      document: Object.keys(DOCUMENT_TEMPLATES).length,
      dashboard: Object.keys(DASHBOARD_TEMPLATES).length
    };
  };

  const stats = getSystemStats();

  // System tabs
  const systems: { id: TemplateSystem; label: string; icon: string; count: number }[] = [
    { id: 'email', label: 'Email', icon: '✉️', count: stats.email },
    { id: 'workflow', label: 'Workflow', icon: '🔄', count: stats.workflow },
    { id: 'ai_prompt', label: 'AI Prompt', icon: '🤖', count: stats.ai_prompt },
    { id: 'sms', label: 'SMS', icon: '📱', count: stats.sms },
    { id: 'notification', label: 'Notification', icon: '🔔', count: stats.notification },
    { id: 'report', label: 'Report', icon: '📊', count: stats.report },
    { id: 'document', label: 'Document', icon: '📄', count: stats.document },
    { id: 'dashboard', label: 'Dashboard', icon: '📊', count: stats.dashboard }
  ];

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          📋 Template Selector
        </h2>
        <p className="text-gray-600">
          Choose from {Object.values(stats).reduce((a, b) => a + b, 0)} templates across {systems.length} systems
        </p>
      </div>

      {/* System Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex overflow-x-auto">
          {systems.map(sys => (
            <button
              key={sys.id}
              onClick={() => setSelectedSystem(sys.id)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                selectedSystem === sys.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              {sys.icon} {sys.label} ({sys.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-200">
        <input
          type="text"
          placeholder="Search templates..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Template List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 max-h-96 overflow-y-auto">
        {filteredTemplates.map((template: any) => (
          <button
            key={template.id}
            onClick={() => handleTemplateClick(template)}
            className={`p-4 border-2 rounded-lg text-left transition-all hover:shadow-md ${
              selectedTemplate?.id === template.id
                ? 'border-blue-600 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-900">{template.name}</h3>
              {template.category && (
                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                  {template.category}
                </span>
              )}
            </div>
            {template.description && (
              <p className="text-sm text-gray-600 line-clamp-2">{template.description}</p>
            )}
            {showStats && (
              <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                {template.variables && (
                  <span>📝 {template.variables.length} variables</span>
                )}
                {template.estimatedTimeSaved && (
                  <span>⏱️ {template.estimatedTimeSaved}</span>
                )}
                {template.refreshInterval && (
                  <span>🔄 {template.refreshInterval}s</span>
                )}
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Preview Panel */}
      {showPreview && selectedTemplate && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">
            📄 Template Preview: {selectedTemplate.name}
          </h3>
          
          <div className="space-y-3">
            {/* ID */}
            <div>
              <label className="text-xs font-medium text-gray-700">Template ID</label>
              <code className="block mt-1 px-3 py-2 bg-white border border-gray-300 rounded text-sm font-mono">
                {selectedTemplate.id}
              </code>
            </div>

            {/* Description */}
            {selectedTemplate.description && (
              <div>
                <label className="text-xs font-medium text-gray-700">Description</label>
                <p className="mt-1 text-sm text-gray-700">{selectedTemplate.description}</p>
              </div>
            )}

            {/* Category */}
            {selectedTemplate.category && (
              <div>
                <label className="text-xs font-medium text-gray-700">Category</label>
                <p className="mt-1 text-sm text-gray-700">{selectedTemplate.category}</p>
              </div>
            )}

            {/* Variables */}
            {selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
              <div>
                <label className="text-xs font-medium text-gray-700">
                  Variables ({selectedTemplate.variables.length})
                </label>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedTemplate.variables.map((variable: string, i: number) => (
                    <span
                      key={i}
                      className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-mono"
                    >
                      {`{{${variable}}}`}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-3">
              <button
                onClick={() => onTemplateSelect?.(selectedTemplate, selectedSystem)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Use Template
              </button>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer Stats */}
      {showStats && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredTemplates.length} of {templates.length} templates
            </span>
            <span className="font-medium">
              Total: {Object.values(stats).reduce((a, b) => a + b, 0)} templates
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;
