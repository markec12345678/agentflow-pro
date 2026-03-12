/**
 * AgentFlow Pro - Workflow Types
 * Type definitions for visual workflow builder
 */

export interface WorkflowNode {
  id: string;
  type: WorkflowNodeType;
  position: { x: number; y: number };
  data: {
    label: string;
    icon: string;
    description?: string;
    config: Record<string, any>;
  };
}

export type WorkflowNodeType = 
  | 'trigger' 
  | 'agent' 
  | 'action' 
  | 'condition' 
  | 'end'
  | 'template';

export interface WorkflowConnection {
  id: string;
  source: string; // source node ID
  target: string; // target node ID
  sourceHandle?: string;
  targetHandle?: string;
  label?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: WorkflowConnection[];
  status: 'draft' | 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  tags?: string[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  workflow: Workflow;
  tags: string[];
  usageCount?: number;
}

export interface NodeConfig {
  nodeId: string;
  settings: Record<string, any>;
  inputs?: Record<string, any>;
  outputs?: Record<string, any>;
}

// Node type configurations
export interface TriggerConfig {
  type: 'webhook' | 'schedule' | 'event' | 'manual';
  webhookUrl?: string;
  schedule?: string; // cron expression
  eventType?: string;
}

export interface AgentConfig {
  agentId: string;
  input: any;
  timeout?: number;
  retryCount?: number;
  outputMapping?: Record<string, string>;
}

export interface ActionConfig {
  actionType: 'api' | 'email' | 'database' | 'file' | 'notification';
  endpoint?: string;
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  templateId?: string;
  recipient?: string;
  subject?: string;
}

export interface ConditionConfig {
  expression: string;
  truePath?: string;
  falsePath?: string;
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'regex';
}

export interface EndConfig {
  output: any;
  webhookUrl?: string;
  notifyEmail?: string;
}
