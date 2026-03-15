'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import { Progress } from '@/web/components/ui/progress';
import { Input } from '@/web/components/ui/input';
import { Label } from '@/web/components/ui/label';
import {
  Play,
  Pause,
  RotateCcw,
  Bug,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  Zap,
  GitBranch,
  Activity,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/web/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/web/components/ui/tabs';
import { ScrollArea } from '@/web/components/ui/scroll-area';

interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: 'running' | 'completed' | 'failed' | 'paused';
  startedAt: Date;
  completedAt?: Date;
  duration: number;
  nodesExecuted: number;
  totalNodes: number;
  error?: string;
  logs: ExecutionLog[];
}

interface ExecutionLog {
  timestamp: Date;
  nodeId: string;
  nodeName: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message?: string;
  inputData?: any;
  outputData?: any;
  error?: string;
  duration?: number;
}

interface WorkflowDebuggerProps {
  workflowId?: string;
}

export default function WorkflowDebugger({ workflowId }: WorkflowDebuggerProps) {
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<WorkflowExecution | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [testDialogOpen, setTestDialogOpen] = useState(false);
  const [testInput, setTestInput] = useState('{}');

  useEffect(() => {
    loadExecutions();
  }, [workflowId]);

  const loadExecutions = async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/executions`);
      const data = await res.json();
      setExecutions(data.executions || []);
    } catch (error) {
      logger.error('Failed to load executions:', error);
      // Mock data for demo
      setExecutions([
        {
          id: 'exec-1',
          workflowId: 'wf-1',
          workflowName: 'Avtomatski Check-in',
          status: 'completed',
          startedAt: new Date(Date.now() - 3600000),
          completedAt: new Date(),
          duration: 2340,
          nodesExecuted: 5,
          totalNodes: 5,
          logs: [
            {
              timestamp: new Date(Date.now() - 3600000),
              nodeId: 'node-1',
              nodeName: 'Trigger: New Booking',
              status: 'completed',
              message: 'Booking received',
              inputData: { bookingId: 'bk-123' },
              duration: 120,
            },
            {
              timestamp: new Date(Date.now() - 3599000),
              nodeId: 'node-2',
              nodeName: 'Check Availability',
              status: 'completed',
              message: 'Room available',
              outputData: { available: true },
              duration: 340,
            },
            {
              timestamp: new Date(Date.now() - 3598000),
              nodeId: 'node-3',
              nodeName: 'Send Confirmation Email',
              status: 'completed',
              message: 'Email sent successfully',
              duration: 890,
            },
          ],
        },
        {
          id: 'exec-2',
          workflowId: 'wf-1',
          workflowName: 'Avtomatski Check-in',
          status: 'failed',
          startedAt: new Date(Date.now() - 7200000),
          completedAt: new Date(Date.now() - 7195000),
          duration: 5000,
          nodesExecuted: 2,
          totalNodes: 5,
          error: 'Email service unavailable',
          logs: [
            {
              timestamp: new Date(Date.now() - 7200000),
              nodeId: 'node-1',
              nodeName: 'Trigger: New Booking',
              status: 'completed',
              duration: 100,
            },
            {
              timestamp: new Date(Date.now() - 7199000),
              nodeId: 'node-2',
              nodeName: 'Send Email',
              status: 'failed',
              error: 'SMTP connection timeout',
              duration: 4900,
            },
          ],
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTest = async () => {
    setRunning(true);
    try {
      const res = await fetch(`/api/workflows/${workflowId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          testMode: true,
          inputData: JSON.parse(testInput),
        }),
      });

      if (!res.ok) throw new Error('Execution failed');

      const data = await res.json();
      toast.success('Test execution started');
      setSelectedExecution(data.execution);
      setTestDialogOpen(false);
      loadExecutions();
    } catch (error) {
      toast.error('Test execution failed');
    } finally {
      setRunning(false);
    }
  };

  const handleRetryExecution = async (executionId: string) => {
    try {
      const res = await fetch(`/api/workflows/executions/${executionId}/retry`, {
        method: 'POST',
      });

      if (!res.ok) throw new Error('Retry failed');

      toast.success('Execution restarted');
      loadExecutions();
    } catch (error) {
      toast.error('Retry failed');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'running':
        return <Activity className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'paused':
        return <Pause className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getLogStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 dark:bg-green-900/20 border-green-300';
      case 'failed':
        return 'bg-red-100 dark:bg-red-900/20 border-red-300';
      case 'running':
        return 'bg-blue-100 dark:bg-blue-900/20 border-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-800 border-gray-300';
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const filteredExecutions = executions.filter((exec) => {
    const matchesFilter =
      filter === 'all' ||
      exec.status === filter ||
      (filter === 'errors' && exec.status === 'failed');
    const matchesSearch =
      exec.workflowName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bug className="w-8 h-8" />
            Workflow Debugger
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Testiraj in debuggaj workflove v realnem času
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadExecutions}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Osveži
          </Button>
          <Button onClick={() => setTestDialogOpen(true)} disabled={running}>
            <Play className="w-4 h-4 mr-2" />
            {running ? 'Running...' : 'Testiraj Workflow'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Executions</CardTitle>
            <Activity className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{executions.length}</div>
            <p className="text-xs text-gray-500">Vse izvedbe</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions.length > 0
                ? Math.round(
                    (executions.filter((e) => e.status === 'completed').length /
                      executions.length) *
                      100
                  )
                : 0}
              %
            </div>
            <p className="text-xs text-gray-500">Uspešnih izvedb</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {executions.length > 0
                ? Math.round(
                    executions.reduce((sum, e) => sum + e.duration, 0) / executions.length
                  )
                : 0}
              ms
            </div>
            <p className="text-xs text-gray-500">Povprečni čas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Errors</CardTitle>
            <AlertTriangle className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {executions.filter((e) => e.status === 'failed').length}
            </div>
            <p className="text-xs text-gray-500">Neuspešne izvedbe</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            placeholder="Išči po imenu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="border rounded-md px-3 py-2 text-sm bg-white dark:bg-gray-800"
          >
            <option value="all">Vsi</option>
            <option value="running">Running</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="errors">Errors Only</option>
          </select>
        </div>
      </div>

      {/* Executions List */}
      <Card>
        <CardHeader>
          <CardTitle>Execution History</CardTitle>
          <CardDescription>Pregled vseh izvedb workflowa</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <div className="space-y-2">
              {filteredExecutions.map((execution) => (
                <div
                  key={execution.id}
                  onClick={() => setSelectedExecution(execution)}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getStatusIcon(execution.status)}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">{execution.workflowName}</span>
                        <Badge
                          variant={
                            execution.status === 'completed'
                              ? 'default'
                              : execution.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                          }
                        >
                          {execution.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        <span>{new Date(execution.startedAt).toLocaleString('sl-SI')}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDuration(execution.duration)}</span>
                        <span className="mx-2">•</span>
                        <span>
                          {execution.nodesExecuted}/{execution.totalNodes} nodes
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {execution.status === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRetryExecution(execution.id);
                        }}
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <GitBranch className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {filteredExecutions.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <Activity className="w-12 h-12 mx-auto mb-4 opacity-20" />
                  <p>Ni najdenih izvedb</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Execution Details Dialog */}
      <Dialog open={!!selectedExecution} onOpenChange={() => setSelectedExecution(null)}>
        {selectedExecution && (
          <DialogContent className="max-w-4xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getStatusIcon(selectedExecution.status)}
                {selectedExecution.workflowName} - Execution Details
              </DialogTitle>
              <DialogDescription>
                {new Date(selectedExecution.startedAt).toLocaleString('sl-SI')} •{' '}
                {formatDuration(selectedExecution.duration)}
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="logs" className="mt-4">
              <TabsList>
                <TabsTrigger value="logs">Execution Logs</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="json">JSON</TabsTrigger>
              </TabsList>

              <TabsContent value="logs" className="space-y-2 max-h-[400px] overflow-y-auto">
                {selectedExecution.logs.map((log, i) => (
                  <div
                    key={i}
                    className={`p-3 border rounded-lg ${getLogStatusColor(log.status)}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {log.status === 'completed' && (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        )}
                        {log.status === 'failed' && (
                          <XCircle className="w-4 h-4 text-red-600" />
                        )}
                        {log.status === 'running' && (
                          <Activity className="w-4 h-4 text-blue-600" />
                        )}
                        <span className="font-medium">{log.nodeName}</span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString('sl-SI')}
                        {log.duration && ` • ${formatDuration(log.duration)}`}
                      </span>
                    </div>
                    {log.message && (
                      <p className="text-sm text-gray-700 dark:text-gray-300">{log.message}</p>
                    )}
                    {log.error && (
                      <p className="text-sm text-red-600 mt-1 font-mono">{log.error}</p>
                    )}
                    {log.inputData && (
                      <div className="mt-2 text-xs">
                        <strong>Input:</strong>
                        <pre className="mt-1 p-2 bg-white dark:bg-gray-900 rounded overflow-auto">
                          {JSON.stringify(log.inputData, null, 2)}
                        </pre>
                      </div>
                    )}
                    {log.outputData && (
                      <div className="mt-2 text-xs">
                        <strong>Output:</strong>
                        <pre className="mt-1 p-2 bg-white dark:bg-gray-900 rounded overflow-auto">
                          {JSON.stringify(log.outputData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="details">
                <div className="space-y-4">
                  <div>
                    <Label>Execution ID</Label>
                    <p className="font-mono text-sm">{selectedExecution.id}</p>
                  </div>
                  <div>
                    <Label>Workflow ID</Label>
                    <p className="font-mono text-sm">{selectedExecution.workflowId}</p>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Badge>{selectedExecution.status}</Badge>
                  </div>
                  <div>
                    <Label>Progress</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress
                        value={(selectedExecution.nodesExecuted / selectedExecution.totalNodes) * 100}
                        className="h-2"
                      />
                      <span className="text-sm">
                        {selectedExecution.nodesExecuted}/{selectedExecution.totalNodes}
                      </span>
                    </div>
                  </div>
                  {selectedExecution.error && (
                    <div>
                      <Label>Error</Label>
                      <p className="text-red-600 font-mono text-sm mt-1">
                        {selectedExecution.error}
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="json">
                <pre className="p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-auto max-h-[400px] text-xs font-mono">
                  {JSON.stringify(selectedExecution, null, 2)}
                </pre>
              </TabsContent>
            </Tabs>

            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => {
                const blob = new Blob([JSON.stringify(selectedExecution, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `execution-${selectedExecution.id}.json`;
                a.click();
              }}>
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button onClick={() => setSelectedExecution(null)}>Close</Button>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* Test Dialog */}
      <Dialog open={testDialogOpen} onOpenChange={setTestDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Testiraj Workflow</DialogTitle>
            <DialogDescription>
              Vnesi testne podatke in zaženi workflow
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="test-input">Input Data (JSON)</Label>
              <textarea
                id="test-input"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                className="w-full h-48 p-3 mt-2 border rounded-md font-mono text-sm bg-white dark:bg-gray-900"
                placeholder='{"bookingId": "bk-123", "guestName": "John Doe"}'
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTestDialogOpen(false)}>
              Prekliči
            </Button>
            <Button onClick={handleRunTest} disabled={running}>
              <Play className="w-4 h-4 mr-2" />
              {running ? 'Running...' : 'Zaženi Test'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
