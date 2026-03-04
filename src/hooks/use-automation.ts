/**
 * React Hook for Integration & Automation Management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  IntegrationConfig,
  WorkflowDefinition,
  WorkflowExecution,
  IntegrationTestResult,
  ExecutionOptions,
  ExecutionFilters,
  DateRange,
  IntegrationMetrics,
  WorkflowMetrics,
  SystemHealth,
  Alert,
  AlertFilters,
  SystemConfig,
  AutomationEvent,
  EventFilter,
  EventCallback,
  IntegrationType,
  IntegrationStatus,
  WorkflowStatus,
  ExecutionStatus,
  TriggerType,
  StepType,
  HttpMethod,
} from '@/types/integration-automation';
import { AutomationEngineImpl } from '@/lib/integration-automation/AutomationEngine';
import { toast } from 'sonner';

interface UseAutomationOptions {
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

interface UseAutomationReturn {
  // State
  integrations: IntegrationConfig[];
  workflows: WorkflowDefinition[];
  executions: WorkflowExecution[];
  systemHealth: SystemHealth | null;
  alerts: Alert[];
  systemConfig: SystemConfig | null;
  isLoading: boolean;
  error: string | null;
  
  // Integration Management
  createIntegration: (config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>) => Promise<IntegrationConfig>;
  updateIntegration: (id: string, updates: Partial<IntegrationConfig>) => Promise<IntegrationConfig>;
  deleteIntegration: (id: string) => Promise<void>;
  testIntegration: (id: string) => Promise<IntegrationTestResult>;
  getIntegrationMetrics: (id: string, period: DateRange) => Promise<IntegrationMetrics>;
  
  // Workflow Management
  createWorkflow: (definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>) => Promise<WorkflowDefinition>;
  updateWorkflow: (id: string, updates: Partial<WorkflowDefinition>) => Promise<WorkflowDefinition>;
  deleteWorkflow: (id: string) => Promise<void>;
  deployWorkflow: (id: string) => Promise<void>;
  undeployWorkflow: (id: string) => Promise<void>;
  getWorkflowMetrics: (id: string, period: DateRange) => Promise<WorkflowMetrics>;
  
  // Execution Management
  executeWorkflow: (workflowId: string, input: Record<string, unknown>, options?: ExecutionOptions) => Promise<WorkflowExecution>;
  getExecution: (id: string) => Promise<WorkflowExecution>;
  getExecutions: (workflowId?: string, filters?: ExecutionFilters) => Promise<WorkflowExecution[]>;
  cancelExecution: (id: string) => Promise<void>;
  retryExecution: (id: string) => Promise<void>;
  
  // Monitoring and Analytics
  getSystemHealth: () => Promise<void>;
  getAlerts: (filters?: AlertFilters) => Promise<void>;
  acknowledgeAlert: (id: string) => Promise<void>;
  resolveAlert: (id: string) => Promise<void>;
  
  // Configuration Management
  updateSystemConfig: (config: Partial<SystemConfig>) => Promise<void>;
  
  // Event Management
  emitEvent: (event: AutomationEvent) => Promise<void>;
  subscribeToEvents: (filters: EventFilter[], callback: EventCallback) => Promise<string>;
  unsubscribeFromEvents: (subscriptionId: string) => Promise<void>;
  
  // Utility functions
  formatDuration: (ms: number) => string;
  formatDate: (date: Date) => string;
  getStatusColor: (status: string) => string;
  getSeverityColor: (severity: string) => string;
  calculateSuccessRate: (successful: number, total: number) => number;
}

export function useAutomation({ 
  autoRefresh = false, 
  refreshInterval = 5 
}: UseAutomationOptions = {}): UseAutomationReturn {
  const [integrations, setIntegrations] = useState<IntegrationConfig[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowDefinition[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [automationEngine, setAutomationEngine] = useState<AutomationEngineImpl | null>(null);

  // Initialize automation engine
  useEffect(() => {
    const engine = new AutomationEngineImpl();
    setAutomationEngine(engine);
  }, []);

  // Load initial data
  useEffect(() => {
    if (automationEngine) {
      loadInitialData();
    }
  }, [automationEngine]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !automationEngine) return;

    const interval = setInterval(() => {
      loadInitialData();
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, automationEngine]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!automationEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      const [integrationsData, workflowsData, healthData, alertsData, configData] = await Promise.all([
        automationEngine.getIntegrations(),
        automationEngine.getWorkflows(),
        automationEngine.getSystemHealth(),
        automationEngine.getAlerts(),
        automationEngine.getSystemConfig(),
      ]);

      setIntegrations(integrationsData);
      setWorkflows(workflowsData);
      setSystemHealth(healthData);
      setAlerts(alertsData);
      setSystemConfig(configData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load automation data';
      setError(errorMessage);
      toast.error('Failed to load automation data');
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  // Integration Management Actions
  const createIntegration = useCallback(async (config: Omit<IntegrationConfig, 'id' | 'createdAt' | 'updatedAt'>): Promise<IntegrationConfig> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      const integration = await automationEngine.createIntegration(config);
      setIntegrations(prev => [...prev, integration]);
      toast.success('Integration created successfully');
      return integration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create integration';
      setError(errorMessage);
      toast.error('Failed to create integration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const updateIntegration = useCallback(async (id: string, updates: Partial<IntegrationConfig>): Promise<IntegrationConfig> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      const integration = await automationEngine.updateIntegration(id, updates);
      setIntegrations(prev => prev.map(i => i.id === id ? integration : i));
      toast.success('Integration updated successfully');
      return integration;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update integration';
      setError(errorMessage);
      toast.error('Failed to update integration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const deleteIntegration = useCallback(async (id: string): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await automationEngine.deleteIntegration(id);
      setIntegrations(prev => prev.filter(i => i.id !== id));
      toast.success('Integration deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete integration';
      setError(errorMessage);
      toast.error('Failed to delete integration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const testIntegration = useCallback(async (id: string): Promise<IntegrationTestResult> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      const result = await automationEngine.testIntegration(id);
      
      if (result.success) {
        toast.success('Integration test passed');
      } else {
        toast.error('Integration test failed');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to test integration';
      setError(errorMessage);
      toast.error('Failed to test integration');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const getIntegrationMetrics = useCallback(async (id: string, period: DateRange): Promise<IntegrationMetrics> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      return await automationEngine.getIntegrationMetrics(id, period);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get integration metrics';
      setError(errorMessage);
      toast.error('Failed to get integration metrics');
      throw err;
    }
  }, [automationEngine]);

  // Workflow Management Actions
  const createWorkflow = useCallback(async (definition: Omit<WorkflowDefinition, 'id' | 'createdAt' | 'updatedAt'>): Promise<WorkflowDefinition> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      const workflow = await automationEngine.createWorkflow(definition);
      setWorkflows(prev => [...prev, workflow]);
      toast.success('Workflow created successfully');
      return workflow;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create workflow';
      setError(errorMessage);
      toast.error('Failed to create workflow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const updateWorkflow = useCallback(async (id: string, updates: Partial<WorkflowDefinition>): Promise<WorkflowDefinition> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      const workflow = await automationEngine.updateWorkflow(id, updates);
      setWorkflows(prev => prev.map(w => w.id === id ? workflow : w));
      toast.success('Workflow updated successfully');
      return workflow;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update workflow';
      setError(errorMessage);
      toast.error('Failed to update workflow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const deleteWorkflow = useCallback(async (id: string): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await automationEngine.deleteWorkflow(id);
      setWorkflows(prev => prev.filter(w => w.id !== id));
      toast.success('Workflow deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete workflow';
      setError(errorMessage);
      toast.error('Failed to delete workflow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const deployWorkflow = useCallback(async (id: string): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await automationEngine.deployWorkflow(id);
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: 'active' } : w));
      toast.success('Workflow deployed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to deploy workflow';
      setError(errorMessage);
      toast.error('Failed to deploy workflow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const undeployWorkflow = useCallback(async (id: string): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await automationEngine.undeployWorkflow(id);
      setWorkflows(prev => prev.map(w => w.id === id ? { ...w, status: 'inactive' } : w));
      toast.success('Workflow undeployed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to undeploy workflow';
      setError(errorMessage);
      toast.error('Failed to undeploy workflow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const getWorkflowMetrics = useCallback(async (id: string, period: DateRange): Promise<WorkflowMetrics> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      return await automationEngine.getWorkflowMetrics(id, period);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get workflow metrics';
      setError(errorMessage);
      toast.error('Failed to get workflow metrics');
      throw err;
    }
  }, [automationEngine]);

  // Execution Management Actions
  const executeWorkflow = useCallback(async (workflowId: string, input: Record<string, unknown>, options?: ExecutionOptions): Promise<WorkflowExecution> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      const execution = await automationEngine.executeWorkflow(workflowId, input, options);
      setExecutions(prev => [execution, ...prev]);
      toast.success('Workflow execution started');
      return execution;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to execute workflow';
      setError(errorMessage);
      toast.error('Failed to execute workflow');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const getExecution = useCallback(async (id: string): Promise<WorkflowExecution> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      return await automationEngine.getExecution(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get execution';
      setError(errorMessage);
      toast.error('Failed to get execution');
      throw err;
    }
  }, [automationEngine]);

  const getExecutions = useCallback(async (workflowId?: string, filters?: ExecutionFilters): Promise<WorkflowExecution[]> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      const executions = await automationEngine.getExecutions(workflowId, filters);
      setExecutions(executions);
      return executions;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get executions';
      setError(errorMessage);
      toast.error('Failed to get executions');
      throw err;
    }
  }, [automationEngine]);

  const cancelExecution = useCallback(async (id: string): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await automationEngine.cancelExecution(id);
      setExecutions(prev => prev.map(e => e.id === id ? { ...e, status: 'cancelled' } : e));
      toast.success('Execution cancelled');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to cancel execution';
      setError(errorMessage);
      toast.error('Failed to cancel execution');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  const retryExecution = useCallback(async (id: string): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    setIsLoading(true);
    setError(null);

    try {
      await automationEngine.retryExecution(id);
      setExecutions(prev => prev.map(e => e.id === id ? { ...e, status: 'pending' } : e));
      toast.success('Execution retry initiated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to retry execution';
      setError(errorMessage);
      toast.error('Failed to retry execution');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [automationEngine]);

  // Monitoring and Analytics Actions
  const getSystemHealth = useCallback(async (): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      const health = await automationEngine.getSystemHealth();
      setSystemHealth(health);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get system health';
      setError(errorMessage);
      toast.error('Failed to get system health');
    }
  }, [automationEngine]);

  const getAlerts = useCallback(async (filters?: AlertFilters): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      const alerts = await automationEngine.getAlerts(filters);
      setAlerts(alerts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get alerts';
      setError(errorMessage);
      toast.error('Failed to get alerts');
    }
  }, [automationEngine]);

  const acknowledgeAlert = useCallback(async (id: string): Promise<void> => {
    try {
      // Mock implementation - in production, call automation engine
      setAlerts(prev => prev.map(alert => 
        alert.id === id 
          ? { ...alert, acknowledged: true, acknowledgedBy: 'current-user', acknowledgedAt: new Date() }
          : alert
      ));
      toast.success('Alert acknowledged');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to acknowledge alert';
      setError(errorMessage);
      toast.error('Failed to acknowledge alert');
    }
  }, []);

  const resolveAlert = useCallback(async (id: string): Promise<void> => {
    try {
      // Mock implementation - in production, call automation engine
      setAlerts(prev => prev.map(alert => 
        alert.id === id 
          ? { ...alert, resolved: true, resolvedBy: 'current-user', resolvedAt: new Date() }
          : alert
      ));
      toast.success('Alert resolved');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resolve alert';
      setError(errorMessage);
      toast.error('Failed to resolve alert');
    }
  }, []);

  // Configuration Management Actions
  const updateSystemConfig = useCallback(async (config: Partial<SystemConfig>): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      const updatedConfig = await automationEngine.updateSystemConfig(config);
      setSystemConfig(updatedConfig);
      toast.success('System configuration updated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update system configuration';
      setError(errorMessage);
      toast.error('Failed to update system configuration');
    }
  }, [automationEngine]);

  // Event Management Actions
  const emitEvent = useCallback(async (event: AutomationEvent): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      await automationEngine.emitEvent(event);
      toast.success('Event emitted');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to emit event';
      setError(errorMessage);
      toast.error('Failed to emit event');
    }
  }, [automationEngine]);

  const subscribeToEvents = useCallback(async (filters: EventFilter[], callback: EventCallback): Promise<string> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      const subscriptionId = await automationEngine.subscribeToEvents(filters, callback);
      toast.success('Event subscription created');
      return subscriptionId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to subscribe to events';
      setError(errorMessage);
      toast.error('Failed to subscribe to events');
      throw err;
    }
  }, [automationEngine]);

  const unsubscribeFromEvents = useCallback(async (subscriptionId: string): Promise<void> => {
    if (!automationEngine) throw new Error('Automation engine not initialized');

    try {
      await automationEngine.unsubscribeFromEvents(subscriptionId);
      toast.success('Event subscription cancelled');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to unsubscribe from events';
      setError(errorMessage);
      toast.error('Failed to unsubscribe from events');
    }
  }, [automationEngine]);

  // Utility functions
  const formatDuration = useCallback((ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }, []);

  const formatDate = useCallback((date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    const colors = {
      active: '#10b981',
      inactive: '#6b7280',
      error: '#ef4444',
      pending: '#f59e0b',
      disabled: '#9ca3af',
      maintenance: '#3b82f6',
      running: '#3b82f6',
      completed: '#10b981',
      failed: '#ef4444',
      cancelled: '#6b7280',
      timeout: '#f59e0b',
      retrying: '#f59e0b',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }, []);

  const getSeverityColor = useCallback((severity: string): string => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626',
      urgent: '#dc2626',
    };
    return colors[severity as keyof typeof colors] || '#6b7280';
  }, []);

  const calculateSuccessRate = useCallback((successful: number, total: number): number => {
    return total > 0 ? (successful / total) * 100 : 0;
  }, []);

  return {
    // State
    integrations,
    workflows,
    executions,
    systemHealth,
    alerts,
    systemConfig,
    isLoading,
    error,
    
    // Integration Management
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    getIntegrationMetrics,
    
    // Workflow Management
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    deployWorkflow,
    undeployWorkflow,
    getWorkflowMetrics,
    
    // Execution Management
    executeWorkflow,
    getExecution,
    getExecutions,
    cancelExecution,
    retryExecution,
    
    // Monitoring and Analytics
    getSystemHealth,
    getAlerts,
    acknowledgeAlert,
    resolveAlert,
    
    // Configuration Management
    updateSystemConfig,
    
    // Event Management
    emitEvent,
    subscribeToEvents,
    unsubscribeFromEvents,
    
    // Utility functions
    formatDuration,
    formatDate,
    getStatusColor,
    getSeverityColor,
    calculateSuccessRate,
  };
}
