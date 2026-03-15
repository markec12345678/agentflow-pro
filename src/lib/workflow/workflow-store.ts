/**
 * AgentFlow Pro - Workflow Store
 * Zustand store for workflow builder state management
 */

import { create } from 'zustand';
import { Workflow, WorkflowNode, WorkflowConnection, WorkflowTemplate } from './types';

interface WorkflowState {
  // Current workflow
  currentWorkflow: Workflow | null;
  workflows: Workflow[];
  templates: WorkflowTemplate[];
  
  // Selected node
  selectedNodeId: string | null;
  
  // Canvas state
  zoom: number;
  pan: { x: number; y: number };
  
  // Actions
  setCurrentWorkflow: (workflow: Workflow | null) => void;
  addWorkflow: (workflow: Workflow) => void;
  updateWorkflow: (workflow: Workflow) => void;
  deleteWorkflow: (workflowId: string) => void;
  
  // Node actions
  addNode: (node: WorkflowNode) => void;
  updateNode: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  deleteNode: (nodeId: string) => void;
  selectNode: (nodeId: string | null) => void;
  
  // Connection actions
  addConnection: (connection: WorkflowConnection) => void;
  deleteConnection: (connectionId: string) => void;
  
  // Template actions
  loadTemplate: (templateId: string) => void;
  setTemplates: (templates: WorkflowTemplate[]) => void;
  
  // Canvas actions
  setZoom: (zoom: number) => void;
  setPan: (pan: { x: number; y: number }) => void;
  
  // Validation
  validateWorkflow: () => { valid: boolean; errors: string[] };
  
  // Save/Load
  saveWorkflow: () => Promise<void>;
  loadWorkflow: (workflowId: string) => Promise<void>;
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  currentWorkflow: null,
  workflows: [],
  templates: [],
  selectedNodeId: null,
  zoom: 1,
  pan: { x: 0, y: 0 },
  
  // Workflow actions
  setCurrentWorkflow: (workflow) => set({ currentWorkflow: workflow }),
  
  addWorkflow: (workflow) => set((state) => ({
    workflows: [...state.workflows, workflow],
    currentWorkflow: workflow,
  })),
  
  updateWorkflow: (workflow) => set((state) => ({
    currentWorkflow: workflow,
    workflows: state.workflows.map(w => w.id === workflow.id ? workflow : w),
  })),
  
  deleteWorkflow: (workflowId) => set((state) => ({
    workflows: state.workflows.filter(w => w.id !== workflowId),
    currentWorkflow: state.currentWorkflow?.id === workflowId ? null : state.currentWorkflow,
  })),
  
  // Node actions
  addNode: (node) => set((state) => ({
    currentWorkflow: state.currentWorkflow ? {
      ...state.currentWorkflow,
      nodes: [...state.currentWorkflow.nodes, node],
    } : null,
  })),
  
  updateNode: (nodeId, data) => set((state) => ({
    currentWorkflow: state.currentWorkflow ? {
      ...state.currentWorkflow,
      nodes: state.currentWorkflow.nodes.map(n => 
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    } : null,
  })),
  
  deleteNode: (nodeId) => set((state) => ({
    currentWorkflow: state.currentWorkflow ? {
      ...state.currentWorkflow,
      nodes: state.currentWorkflow.nodes.filter(n => n.id !== nodeId),
      connections: state.currentWorkflow.connections.filter(
        c => c.source !== nodeId && c.target !== nodeId
      ),
    } : null,
    selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
  })),
  
  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),
  
  // Connection actions
  addConnection: (connection) => set((state) => ({
    currentWorkflow: state.currentWorkflow ? {
      ...state.currentWorkflow,
      connections: [...state.currentWorkflow.connections, connection],
    } : null,
  })),
  
  deleteConnection: (connectionId) => set((state) => ({
    currentWorkflow: state.currentWorkflow ? {
      ...state.currentWorkflow,
      connections: state.currentWorkflow.connections.filter(c => c.id !== connectionId),
    } : null,
  })),
  
  // Template actions
  loadTemplate: (templateId) => {
    const template = get().templates.find(t => t.id === templateId);
    if (template) {
      set({ currentWorkflow: { ...template.workflow, id: `workflow_${Date.now()}` } });
    }
  },
  
  setTemplates: (templates) => set({ templates }),
  
  // Canvas actions
  setZoom: (zoom) => set({ zoom }),
  setPan: (pan) => set({ pan }),
  
  // Validation
  validateWorkflow: () => {
    const { currentWorkflow } = get();
    const errors: string[] = [];
    
    if (!currentWorkflow) {
      return { valid: false, errors: ['No workflow loaded'] };
    }
    
    // Check for trigger node
    const hasTrigger = currentWorkflow.nodes.some(n => n.type === 'trigger');
    if (!hasTrigger) {
      errors.push('Workflow must have a trigger node');
    }
    
    // Check for end node
    const hasEnd = currentWorkflow.nodes.some(n => n.type === 'end');
    if (!hasEnd) {
      errors.push('Workflow must have an end node');
    }
    
    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>();
    currentWorkflow.connections.forEach(c => {
      connectedNodeIds.add(c.source);
      connectedNodeIds.add(c.target);
    });
    
    currentWorkflow.nodes.forEach(n => {
      if (!connectedNodeIds.has(n.id) && n.type !== 'trigger' && n.type !== 'end') {
        errors.push(`Node "${n.data.label}" is not connected`);
      }
    });
    
    return { valid: errors.length === 0, errors };
  },
  
  // Save/Load
  saveWorkflow: async () => {
    const { currentWorkflow } = get();
    if (!currentWorkflow) return;
    
    // In production, save to database via API
    logger.info('Saving workflow:', currentWorkflow);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  },
  
  loadWorkflow: async (workflowId) => {
    // In production, load from database via API
    logger.info('Loading workflow:', workflowId);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
  },
}));
