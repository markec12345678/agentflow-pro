'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import { Input } from '@/web/components/ui/input';
import { ScrollArea } from '@/web/components/ui/scroll-area';
import {
  Play,
  Pause,
  StepForward,
  StepBack,
  Bug,
  RotateCcw,
  ChevronRight,
  ChevronDown,
  Database,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Download,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';

interface WorkflowExecutionDebug {
  id: string;
  workflowId: string;
  status: 'running' | 'paused' | 'completed' | 'failed';
  currentStep?: number;
  totalSteps: number;
  variables: Record<string, any>;
  stepHistory: ExecutionStep[];
  logs: DebugLog[];
}

interface ExecutionStep {
  id: string;
  nodeId: string;
  nodeName: string;
  nodeType: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  input?: any;
  output?: any;
  error?: string;
  duration?: number;
  startTime?: Date;
  endTime?: Date;
}

interface DebugLog {
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: any;
}

interface WorkflowDebuggerEnhancedProps {
  workflowId: string;
  initialExecution?: WorkflowExecutionDebug;
}

export default function WorkflowDebuggerEnhanced({
  workflowId,
  initialExecution,
}: WorkflowDebuggerEnhancedProps) {
  const [execution, setExecution] = useState<WorkflowExecutionDebug | null>(initialExecution || null);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [selectedStep, setSelectedStep] = useState<string | null>(null);
  const [breakpoints, setBreakpoints] = useState<Set<string>>(new Set());
  const [stepThroughMode, setStepThroughMode] = useState(false);
  const [variableFilter, setVariableFilter] = useState('');
  const [logFilter, setLogFilter] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['variables', 'logs']));

  const handleStartDebug = async () => {
    setRunning(true);
    setPaused(false);
    setStepThroughMode(true);
    
    try {
      const res = await fetch(`/api/workflows/${workflowId}/debug/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepThrough: true,
          breakpoints: Array.from(breakpoints),
        }),
      });

      if (!res.ok) throw new Error('Failed to start debug');

      const data = await res.json();
      setExecution(data.execution);
      toast.success('Debug session started');
    } catch (error) {
      toast.error('Failed to start debug session');
    }
  };

  const handleStepForward = async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/debug/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: 'forward',
          executionId: execution?.id,
        }),
      });

      if (!res.ok) throw new Error('Step failed');

      const data = await res.json();
      setExecution(data.execution);
      toast.success('Stepped forward');
    } catch (error) {
      toast.error('Step forward failed');
    }
  };

  const handleStepBack = async () => {
    try {
      const res = await fetch(`/api/workflows/${workflowId}/debug/step`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          direction: 'backward',
          executionId: execution?.id,
        }),
      });

      if (!res.ok) throw new Error('Step back failed');

      const data = await res.json();
      setExecution(data.execution);
      toast.success('Stepped back');
    } catch (error) {
      toast.error('Step back failed');
    }
  };

  const handleResume = async () => {
    setPaused(false);
    setStepThroughMode(false);
    
    try {
      const res = await fetch(`/api/workflows/${workflowId}/debug/resume`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId: execution?.id }),
      });

      if (!res.ok) throw new Error('Resume failed');

      const data = await res.json();
      setExecution(data.execution);
      toast.success('Execution resumed');
    } catch (error) {
      toast.error('Resume failed');
    }
  };

  const handlePause = () => {
    setPaused(true);
    setStepThroughMode(true);
    toast.info('Execution paused');
  };

  const handleStop = () => {
    setRunning(false);
    setPaused(false);
    setStepThroughMode(false);
    toast.info('Debug session stopped');
  };

  const toggleBreakpoint = (nodeId: string) => {
    const newBreakpoints = new Set(breakpoints);
    if (newBreakpoints.has(nodeId)) {
      newBreakpoints.delete(nodeId);
    } else {
      newBreakpoints.add(nodeId);
    }
    setBreakpoints(newBreakpoints);
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const copyToClipboard = (data: any) => {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('Copied to clipboard');
  };

  const exportExecution = () => {
    if (!execution) return;
    
    const blob = new Blob([JSON.stringify(execution, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `debug-${execution.id}-${new Date().toISOString()}.json`;
    a.click();
    toast.success('Execution exported');
  };

  const filteredVariables = execution?.variables 
    ? Object.entries(execution.variables).filter(([key]) =>
        key.toLowerCase().includes(variableFilter.toLowerCase())
      )
    : [];

  const filteredLogs = execution?.logs
    ? execution.logs.filter(log =>
        log.message.toLowerCase().includes(logFilter.toLowerCase())
      )
    : [];

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'running':
        return <Bug className="w-4 h-4 text-blue-600 animate-pulse" />;
      case 'skipped':
        return <RotateCcw className="w-4 h-4 text-gray-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getLogColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600';
      case 'warn':
        return 'text-yellow-600';
      case 'debug':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      {/* Debug Controls */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Debug Controls
            </CardTitle>
            <div className="flex gap-2">
              {!running ? (
                <Button size="sm" onClick={handleStartDebug}>
                  <Play className="w-4 h-4 mr-2" />
                  Start Debug
                </Button>
              ) : (
                <>
                  {!paused ? (
                    <Button size="sm" variant="outline" onClick={handlePause}>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  ) : (
                    <Button size="sm" onClick={handleResume}>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={handleStepBack} disabled={!stepThroughMode}>
                    <StepBack className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleStepForward} disabled={!stepThroughMode}>
                    <StepForward className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="destructive" onClick={handleStop}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Stop
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {execution && (
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Status:</span>
                <Badge variant={execution.status === 'completed' ? 'default' : execution.status === 'failed' ? 'destructive' : 'secondary'}>
                  {execution.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Progress:</span>
                <span className="font-mono">
                  {execution.currentStep || 0} / {execution.totalSteps}
                </span>
              </div>
              {paused && (
                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                  <Pause className="w-3 h-3 mr-1" />
                  Paused at breakpoint
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Variable Inspector */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center gap-2">
                <Database className="w-4 h-4" />
                Variable Inspector
              </CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(execution?.variables)}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => toggleSection('variables')}>
                  {expandedSections.has('variables') ? (
                    <ChevronDown className="w-3 h-3" />
                  ) : (
                    <ChevronRight className="w-3 h-3" />
                  )}
                </Button>
              </div>
            </div>
            {expandedSections.has('variables') && (
              <div className="relative mt-2">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Filter variables..."
                  value={variableFilter}
                  onChange={(e) => setVariableFilter(e.target.value)}
                  className="pl-8 h-8 text-sm"
                />
              </div>
            )}
          </CardHeader>
          {expandedSections.has('variables') && (
            <CardContent>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {filteredVariables.map(([key, value]) => (
                    <div key={key} className="p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono font-bold text-blue-600">{key}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-5 w-5 p-0"
                          onClick={() => copyToClipboard(value)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <pre className="whitespace-pre-wrap break-all text-gray-700 dark:text-gray-300">
                        {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                      </pre>
                    </div>
                  ))}
                  {filteredVariables.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      <Database className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No variables found
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          )}
        </Card>

        {/* Step History */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Step History</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {execution?.stepHistory.map((step, index) => (
                  <div
                    key={step.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-all ${
                      selectedStep === step.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                    onClick={() => setSelectedStep(step.id)}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {getStepIcon(step.status)}
                      <span className="font-semibold text-sm">{step.nodeName}</span>
                      <Badge variant="outline" className="text-xs">
                        {step.nodeType}
                      </Badge>
                      {breakpoints.has(step.nodeId) && (
                        <Badge variant="destructive" className="text-xs">
                          <Bug className="w-3 h-3" />
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-2">
                      <span>Step {index + 1}</span>
                      {step.duration && (
                        <>
                          <span>•</span>
                          <span>{step.duration}ms</span>
                        </>
                      )}
                      {step.error && (
                        <>
                          <span>•</span>
                          <span className="text-red-600">Error</span>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Execution Logs */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Debug Logs
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={exportExecution}>
                <Download className="w-3 h-3 mr-2" />
                Export
              </Button>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Filter logs..."
                  value={logFilter}
                  onChange={(e) => setLogFilter(e.target.value)}
                  className="pl-8 h-8 text-sm w-64"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {filteredLogs.map((log, index) => (
                <div
                  key={index}
                  className={`p-3 border rounded-lg text-xs font-mono ${
                    log.level === 'error'
                      ? 'bg-red-50 dark:bg-red-900/20 border-red-200'
                      : log.level === 'warn'
                      ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200'
                      : 'bg-gray-50 dark:bg-gray-800 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <Badge variant="outline" className={`text-xs ${getLogColor(log.level)}`}>
                      {log.level.toUpperCase()}
                    </Badge>
                  </div>
                  <div className={getLogColor(log.level)}>{log.message}</div>
                  {log.data && (
                    <pre className="mt-2 whitespace-pre-wrap break-all text-gray-600 dark:text-gray-400">
                      {JSON.stringify(log.data, null, 2)}
                    </pre>
                  )}
                </div>
              ))}
              {filteredLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500 text-sm">
                  <Bug className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  No logs found
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Selected Step Details */}
      {selectedStep && execution?.stepHistory.find(s => s.id === selectedStep) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Step Details</CardTitle>
          </CardHeader>
          <CardContent>
            {(() => {
              const step = execution.stepHistory.find(s => s.id === selectedStep)!;
              return (
                <div className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <h4 className="text-xs font-semibold mb-2">Input</h4>
                      <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-auto max-h-[200px]">
                        {JSON.stringify(step.input, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="text-xs font-semibold mb-2">Output</h4>
                      <pre className="p-3 bg-gray-50 dark:bg-gray-800 rounded text-xs overflow-auto max-h-[200px]">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                  {step.error && (
                    <div>
                      <h4 className="text-xs font-semibold mb-2 text-red-600">Error</h4>
                      <pre className="p-3 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 overflow-auto">
                        {step.error}
                      </pre>
                    </div>
                  )}
                  <div className="flex gap-2 text-xs">
                    <span className="text-gray-500">Duration:</span>
                    <span className="font-mono">{step.duration || 0}ms</span>
                    <span className="text-gray-500 ml-4">Status:</span>
                    <Badge>{step.status}</Badge>
                  </div>
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
