/**
 * Integration & Automation Dashboard Component
 * Comprehensive dashboard for managing integrations and workflows
 */

"use client";

import { useState, useEffect } from 'react';
import { useAutomation } from '@/hooks/use-automation';
import { format, subDays } from 'date-fns';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface AutomationDashboardProps {
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

export default function AutomationDashboard({ 
  autoRefresh = true, 
  refreshInterval = 5 
}: AutomationDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'integrations' | 'workflows' | 'executions' | 'monitoring'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<string | null>(null);

  const {
    integrations,
    workflows,
    executions,
    systemHealth,
    alerts,
    systemConfig,
    isLoading,
    error,
    createIntegration,
    updateIntegration,
    deleteIntegration,
    testIntegration,
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    deployWorkflow,
    undeployWorkflow,
    executeWorkflow,
    getExecutions,
    getSystemHealth,
    acknowledgeAlert,
    resolveAlert,
    formatDuration,
    formatDate,
    getStatusColor,
    getSeverityColor,
    calculateSuccessRate,
  } = useAutomation({ autoRefresh, refreshInterval });

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        getSystemHealth();
      }, refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, getSystemHealth]);

  const handleTestIntegration = async (integrationId: string) => {
    try {
      const result = await testIntegration(integrationId);
      if (result.success) {
        // Update integration status
        await updateIntegration(integrationId, { status: 'active' });
      }
    } catch (error) {
      console.error('Integration test failed:', error);
    }
  };

  const handleDeployWorkflow = async (workflowId: string) => {
    try {
      await deployWorkflow(workflowId);
    } catch (error) {
      console.error('Workflow deployment failed:', error);
    }
  };

  const handleExecuteWorkflow = async (workflowId: string) => {
    try {
      await executeWorkflow(workflowId, { test: 'execution' });
    } catch (error) {
      console.error('Workflow execution failed:', error);
    }
  };

  const renderOverviewTab = () => {
    if (!systemHealth || !systemConfig) return null;

    const integrationStats = {
      active: integrations.filter(i => i.status === 'active').length,
      inactive: integrations.filter(i => i.status === 'inactive').length,
      error: integrations.filter(i => i.status === 'error').length,
      total: integrations.length,
    };

    const workflowStats = {
      active: workflows.filter(w => w.status === 'active').length,
      inactive: workflows.filter(w => w.status === 'inactive').length,
      draft: workflows.filter(w => w.status === 'draft').length,
      total: workflows.length,
    };

    const executionStats = {
      running: executions.filter(e => e.status === 'running').length,
      completed: executions.filter(e => e.status === 'completed').length,
      failed: executions.filter(e => e.status === 'failed').length,
      total: executions.length,
    };

    const healthData = systemHealth.components.map(component => ({
      name: component.name,
      status: component.status,
      responseTime: component.responseTime || 0,
    }));

    return (
      <div className="space-y-6">
        {/* System Health Overview */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${
                systemHealth.status === 'healthy' ? 'bg-green-500' :
                systemHealth.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-lg font-medium capitalize">{systemHealth.status}</span>
            </div>
            <span className="text-sm text-gray-500">
              Last checked: {formatDate(systemHealth.timestamp)}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {systemHealth.components.map((component, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded">
                <span className="text-sm font-medium">{component.name}</span>
                <div className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    component.status === 'healthy' ? 'bg-green-500' :
                    component.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs text-gray-500">{component.responseTime}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Integrations</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <span className="text-sm font-medium text-green-600">{integrationStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Inactive</span>
                <span className="text-sm font-medium text-gray-600">{integrationStats.inactive}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Errors</span>
                <span className="text-sm font-medium text-red-600">{integrationStats.error}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-sm font-medium text-gray-900">{integrationStats.total}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Workflows</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active</span>
                <span className="text-sm font-medium text-green-600">{workflowStats.active}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Draft</span>
                <span className="text-sm font-medium text-gray-600">{workflowStats.draft}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Inactive</span>
                <span className="text-sm font-medium text-gray-600">{workflowStats.inactive}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-sm font-medium text-gray-900">{workflowStats.total}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Executions</h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Running</span>
                <span className="text-sm font-medium text-blue-600">{executionStats.running}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Completed</span>
                <span className="text-sm font-medium text-green-600">{executionStats.completed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Failed</span>
                <span className="text-sm font-medium text-red-600">{executionStats.failed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-sm font-medium text-gray-900">{executionStats.total}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Active Alerts */}
        {alerts.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Alerts</h3>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full mr-3`} style={{ backgroundColor: getSeverityColor(alert.severity) }} />
                    <div>
                      <h5 className="font-medium text-gray-900">{alert.name}</h5>
                      <p className="text-sm text-gray-600">{alert.message}</p>
                      <p className="text-xs text-gray-500">{formatDate(alert.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {!alert.acknowledged && (
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                      >
                        Acknowledge
                      </button>
                    )}
                    <button
                      onClick={() => resolveAlert(alert.id)}
                      className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
                    >
                      Resolve
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderIntegrationsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Integrations</h3>
          <button
            onClick={() => setShowIntegrationModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Integration
          </button>
        </div>

        {/* Integration List */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Sync</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {integrations.map((integration) => (
                  <tr key={integration.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {integration.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {integration.type.replace('-', ' ')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {integration.provider}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: getStatusColor(integration.status) + '20', color: getStatusColor(integration.status) }}
                      >
                        {integration.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {integration.lastSyncAt ? formatDate(integration.lastSyncAt) : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleTestIntegration(integration.id)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Test
                        </button>
                        <button
                          onClick={() => setSelectedIntegration(integration.id)}
                          className="text-gray-600 hover:text-gray-900"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => deleteIntegration(integration.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderWorkflowsTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Workflows</h3>
          <button
            onClick={() => setShowWorkflowModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Workflow
          </button>
        </div>

        {/* Workflow List */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trigger</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Executions</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Success Rate</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {workflows.map((workflow) => {
                  const workflowExecutions = executions.filter(e => e.workflowId === workflow.id);
                  const successRate = calculateSuccessRate(
                    workflowExecutions.filter(e => e.status === 'completed').length,
                    workflowExecutions.length
                  );

                  return (
                    <tr key={workflow.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {workflow.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {workflow.trigger.type}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ backgroundColor: getStatusColor(workflow.status) + '20', color: getStatusColor(workflow.status) }}
                        >
                          {workflow.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {workflowExecutions.length}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {successRate.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleExecuteWorkflow(workflow.id)}
                            className="text-blue-600 hover:text-blue-900"
                            disabled={workflow.status !== 'active'}
                          >
                            Execute
                          </button>
                          {workflow.status === 'active' ? (
                            <button
                              onClick={() => undeployWorkflow(workflow.id)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Undeploy
                            </button>
                          ) : (
                            <button
                              onClick={() => handleDeployWorkflow(workflow.id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Deploy
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedWorkflow(workflow.id)}
                            className="text-gray-600 hover:text-gray-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => deleteWorkflow(workflow.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderExecutionsTab = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Recent Executions</h3>

        {/* Execution List */}
        <div className="bg-white rounded-lg shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Workflow</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Started</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {executions.slice(0, 20).map((execution) => {
                  const workflow = workflows.find(w => w.id === execution.workflowId);
                  
                  return (
                    <tr key={execution.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {workflow?.name || 'Unknown'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className="px-2 py-1 text-xs rounded-full"
                          style={{ backgroundColor: getStatusColor(execution.status) + '20', color: getStatusColor(execution.status) }}
                        >
                          {execution.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(execution.startedAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {execution.duration ? formatDuration(execution.duration) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {/* View details */}}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          {execution.status === 'running' && (
                            <button
                              onClick={() => {/* Cancel execution */}}
                              className="text-red-600 hover:text-red-900"
                            >
                              Cancel
                            </button>
                          )}
                          {execution.status === 'failed' && (
                            <button
                              onClick={() => {/* Retry execution */}}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              Retry
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMonitoringTab = () => {
    if (!systemHealth) return null;

    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">System Monitoring</h3>

        {/* System Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600">CPU Usage</h4>
            <p className="text-2xl font-bold text-gray-900">{systemHealth.metrics.cpu.toFixed(1)}%</p>
            <p className="text-xs text-green-600">Normal</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600">Memory Usage</h4>
            <p className="text-2xl font-bold text-gray-900">{systemHealth.metrics.memory.toFixed(1)}%</p>
            <p className="text-xs text-green-600">Normal</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600">Disk Usage</h4>
            <p className="text-2xl font-bold text-gray-900">{systemHealth.metrics.disk.toFixed(1)}%</p>
            <p className="text-xs text-green-600">Normal</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600">Active Connections</h4>
            <p className="text-2xl font-bold text-gray-900">{systemHealth.metrics.activeConnections}</p>
            <p className="text-xs text-green-600">Healthy</p>
          </div>
        </div>

        {/* Component Health */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Component Health</h4>
          <div className="space-y-3">
            {systemHealth.components.map((component, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">{component.name}</h5>
                  <p className="text-sm text-gray-600">{component.message}</p>
                  <p className="text-xs text-gray-500">
                    Last check: {formatDate(component.lastCheck)}
                    {component.uptime && ` • Uptime: ${component.uptime.toFixed(1)}%`}
                  </p>
                </div>
                <div className="text-right">
                  <div className={`w-3 h-3 rounded-full mb-2`} style={{ backgroundColor: getStatusColor(component.status) }} />
                  {component.responseTime && (
                    <p className="text-xs text-gray-500">{component.responseTime}ms</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading && !systemHealth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Automation Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Integration & Automation</h1>
              <span className="ml-4 text-sm text-gray-500">
                Environment: {systemConfig?.environment || 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {(['7d', '30d', '90d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      selectedPeriod === period
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'integrations', label: 'Integrations' },
              { id: 'workflows', label: 'Workflows' },
              { id: 'executions', label: 'Executions' },
              { id: 'monitoring', label: 'Monitoring' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'integrations' && renderIntegrationsTab()}
          {activeTab === 'workflows' && renderWorkflowsTab()}
          {activeTab === 'executions' && renderExecutionsTab()}
          {activeTab === 'monitoring' && renderMonitoringTab()}
        </motion.div>
      </div>
    </div>
  );
}
