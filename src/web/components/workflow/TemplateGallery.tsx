'use client';

/**
 * AgentFlow Pro - Template Gallery
 * Modal for browsing and importing workflow templates
 */

import { useState } from 'react';
import { useWorkflowStore } from '@/lib/workflow/workflow-store';

interface TemplateGalleryProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function TemplateGallery({ isOpen, onClose }: TemplateGalleryProps) {
  const { templates, loadTemplate } = useWorkflowStore();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Content', 'Tourism', 'E-commerce', 'Marketing', 'Automation'];

  const filteredTemplates = selectedCategory === 'All'
    ? templates
    : templates.filter(t => t.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Workflow Templates</h2>
            <p className="text-sm text-gray-500 mt-1">
              Start with a pre-built workflow
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Category Filter */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex gap-2 overflow-x-auto">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                onClick={() => {
                  loadTemplate(template.id);
                  onClose?.();
                }}
                className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-500 hover:shadow-lg transition-all"
              >
                <div className="text-4xl mb-3">{template.icon}</div>
                <h3 className="font-bold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                
                <div className="flex items-center justify-between">
                  <div className="flex gap-1">
                    {template.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                  <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Use Template →
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center py-12">
              <div className="text-5xl mb-4">📋</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No templates found
              </h3>
              <p className="text-gray-500">
                Try selecting a different category
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
