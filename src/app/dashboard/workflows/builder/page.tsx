'use client';

/**
 * AgentFlow Pro - Visual Workflow Builder
 * Drag-and-drop workflow builder with React Flow
 */

import { useCallback, useEffect } from 'react';
import { useWorkflowStore } from '@/lib/workflow/workflow-store';
import WorkflowCanvas from '@/web/components/workflow/WorkflowCanvas';
import NodePalette from '@/web/components/workflow/NodePalette';
import NodeConfigPanel from '@/web/components/workflow/NodeConfigPanel';
import WorkflowToolbar from '@/web/components/workflow/WorkflowToolbar';
import TemplateGallery from '@/web/components/workflow/TemplateGallery';

export default function WorkflowBuilderPage() {
  const { 
    currentWorkflow, 
    selectedNodeId, 
    selectNode,
    validateWorkflow,
    saveWorkflow,
    setTemplates 
  } = useWorkflowStore();

  // Load templates on mount
  useEffect(() => {
    const templates = [
      {
        id: 'template-1',
        name: 'AI Content Generator',
        description: 'Generate SEO-optimized blog posts automatically',
        category: 'Content',
        icon: '📝',
        tags: ['content', 'seo', 'ai'],
        workflow: {
          id: 'template-1',
          name: 'AI Content Generator',
          nodes: [],
          connections: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      },
      {
        id: 'template-2',
        name: 'Guest Communication Automation',
        description: 'Automated guest messaging for bookings',
        category: 'Tourism',
        icon: '💬',
        tags: ['tourism', 'messaging', 'automation'],
        workflow: {
          id: 'template-2',
          name: 'Guest Communication',
          nodes: [],
          connections: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      },
      {
        id: 'template-3',
        name: 'Dynamic Pricing Engine',
        description: 'AI-powered pricing optimization',
        category: 'Tourism',
        icon: '💰',
        tags: ['pricing', 'ai', 'tourism'],
        workflow: {
          id: 'template-3',
          name: 'Dynamic Pricing',
          nodes: [],
          connections: [],
          status: 'active',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      },
    ];
    setTemplates(templates);
  }, [setTemplates]);

  const handleSave = useCallback(async () => {
    const validation = validateWorkflow();
    if (!validation.valid) {
      alert('Workflow validation errors:\n' + validation.errors.join('\n'));
      return;
    }
    
    await saveWorkflow();
    alert('Workflow saved successfully!');
  }, [validateWorkflow, saveWorkflow]);

  const handleTest = useCallback(() => {
    alert('Testing workflow execution...');
    // Implement test execution
  }, []);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Toolbar */}
      <WorkflowToolbar
        workflow={currentWorkflow}
        onSave={handleSave}
        onTest={handleTest}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Node Palette */}
        <NodePalette />
        
        {/* Canvas */}
        <WorkflowCanvas
          selectedNodeId={selectedNodeId}
          onNodeSelect={selectNode}
        />
        
        {/* Configuration Panel */}
        <NodeConfigPanel
          nodeId={selectedNodeId}
          onClose={() => selectNode(null)}
        />
      </div>
      
      {/* Template Gallery Modal */}
      <TemplateGallery />
    </div>
  );
}
