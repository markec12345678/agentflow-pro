'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/web/components/ui/card';
import { Button } from '@/web/components/ui/button';
import { Badge } from '@/web/components/ui/badge';
import { Input } from '@/web/components/ui/input';
import { Label } from '@/web/components/ui/label';
import { Switch } from '@/web/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/web/components/ui/select';
import {
  AlertTriangle,
  RotateCcw,
  GitBranch,
  Plus,
  Trash2,
  Save,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface RetryConfig {
  enabled: boolean;
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
  retryOnErrors: string[];
}

interface FallbackPath {
  id: string;
  name: string;
  condition: 'on_error' | 'on_timeout' | 'on_specific_error' | 'always';
  errorCode?: string;
  targetNodeId?: string;
  actions: FallbackAction[];
}

interface FallbackAction {
  type: 'notify' | 'log' | 'execute_workflow' | 'send_webhook' | 'set_variable';
  config: any;
}

interface ErrorHandlingConfigProps {
  nodeId: string;
  onSave?: (config: ErrorHandlingConfig) => void;
}

interface ErrorHandlingConfig {
  retry: RetryConfig;
  fallbacks: FallbackPath[];
}

export default function ErrorHandlingConfig({ nodeId, onSave }: ErrorHandlingConfigProps) {
  const [config, setConfig] = useState<ErrorHandlingConfig>({
    retry: {
      enabled: false,
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      retryOnErrors: ['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT'],
    },
    fallbacks: [],
  });

  const [showAddFallback, setShowAddFallback] = useState(false);

  const handleSave = () => {
    onSave?.(config);
    toast.success('Error handling configuration saved');
  };

  const updateRetryConfig = (updates: Partial<RetryConfig>) => {
    setConfig(prev => ({
      ...prev,
      retry: { ...prev.retry, ...updates },
    }));
  };

  const addFallback = () => {
    const newFallback: FallbackPath = {
      id: `fallback-${Date.now()}`,
      name: `Fallback ${config.fallbacks.length + 1}`,
      condition: 'on_error',
      actions: [],
    };
    setConfig(prev => ({
      ...prev,
      fallbacks: [...prev.fallbacks, newFallback],
    }));
  };

  const removeFallback = (fallbackId: string) => {
    setConfig(prev => ({
      ...prev,
      fallbacks: prev.fallbacks.filter(f => f.id !== fallbackId),
    }));
  };

  const updateFallback = (fallbackId: string, updates: Partial<FallbackPath>) => {
    setConfig(prev => ({
      ...prev,
      fallbacks: prev.fallbacks.map(f =>
        f.id === fallbackId ? { ...f, ...updates } : f
      ),
    }));
  };

  const addFallbackAction = (fallbackId: string, action: FallbackAction) => {
    setConfig(prev => ({
      ...prev,
      fallbacks: prev.fallbacks.map(f =>
        f.id === fallbackId ? { ...f, actions: [...f.actions, action] } : f
      ),
    }));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          Error Handling Configuration
        </CardTitle>
        <CardDescription>
          Configure retry logic and fallback paths for node: {nodeId}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Retry Configuration */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold">Retry Logic</h3>
            </div>
            <Switch
              checked={config.retry.enabled}
              onCheckedChange={(enabled) => updateRetryConfig({ enabled })}
            />
          </div>

          {config.retry.enabled && (
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="maxAttempts">Max Attempts</Label>
                <Input
                  id="maxAttempts"
                  type="number"
                  value={config.retry.maxAttempts}
                  onChange={(e) =>
                    updateRetryConfig({ maxAttempts: parseInt(e.target.value) || 3 })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="delayMs">Initial Delay (ms)</Label>
                <Input
                  id="delayMs"
                  type="number"
                  value={config.retry.delayMs}
                  onChange={(e) =>
                    updateRetryConfig({ delayMs: parseInt(e.target.value) || 1000 })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="backoffMultiplier">Backoff Multiplier</Label>
                <Input
                  id="backoffMultiplier"
                  type="number"
                  step="0.1"
                  value={config.retry.backoffMultiplier}
                  onChange={(e) =>
                    updateRetryConfig({
                      backoffMultiplier: parseFloat(e.target.value) || 2,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>
          )}

          {config.retry.enabled && (
            <div>
              <Label>Retry on Errors</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['NETWORK_ERROR', 'TIMEOUT', 'RATE_LIMIT', 'SERVER_ERROR', 'VALIDATION_ERROR'].map(
                  (errorType) => (
                    <Badge
                      key={errorType}
                      variant={
                        config.retry.retryOnErrors.includes(errorType)
                          ? 'default'
                          : 'outline'
                      }
                      className="cursor-pointer"
                      onClick={() => {
                        const errors = config.retry.retryOnErrors.includes(errorType)
                          ? config.retry.retryOnErrors.filter((e) => e !== errorType)
                          : [...config.retry.retryOnErrors, errorType];
                        updateRetryConfig({ retryOnErrors: errors });
                      }}
                    >
                      {errorType}
                    </Badge>
                  )
                )}
              </div>
            </div>
          )}
        </div>

        {/* Fallback Paths */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">Fallback Paths</h3>
            </div>
            <Button size="sm" onClick={addFallback}>
              <Plus className="w-4 h-4 mr-2" />
              Add Fallback
            </Button>
          </div>

          {config.fallbacks.map((fallback) => (
            <Card key={fallback.id} className="border-purple-200 dark:border-purple-800">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitBranch className="w-4 h-4 text-purple-600" />
                    <Input
                      value={fallback.name}
                      onChange={(e) =>
                        updateFallback(fallback.id, { name: e.target.value })
                      }
                      className="font-semibold border-none p-0 h-auto focus-visible:ring-0"
                    />
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFallback(fallback.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Trigger Condition</Label>
                    <Select
                      value={fallback.condition}
                      onValueChange={(value: any) =>
                        updateFallback(fallback.id, { condition: value })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on_error">On Any Error</SelectItem>
                        <SelectItem value="on_timeout">On Timeout</SelectItem>
                        <SelectItem value="on_specific_error">
                          On Specific Error
                        </SelectItem>
                        <SelectItem value="always">Always Execute</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {fallback.condition === 'on_specific_error' && (
                    <div>
                      <Label>Error Code</Label>
                      <Input
                        placeholder="e.g., NETWORK_ERROR"
                        value={fallback.errorCode || ''}
                        onChange={(e) =>
                          updateFallback(fallback.id, { errorCode: e.target.value })
                        }
                        className="mt-1"
                      />
                    </div>
                  )}

                  <div>
                    <Label>Target Node (Optional)</Label>
                    <Select
                      value={fallback.targetNodeId || ''}
                      onValueChange={(targetNodeId) =>
                        updateFallback(fallback.id, { targetNodeId })
                      }
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select target node..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="node-1">Node 1</SelectItem>
                        <SelectItem value="node-2">Node 2</SelectItem>
                        <SelectItem value="node-3">Node 3</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Fallback Actions */}
                <div className="space-y-2">
                  <Label>Actions</Label>
                  {fallback.actions.map((action, index) => (
                    <div
                      key={index}
                      className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded text-xs"
                    >
                      <span className="font-semibold">{action.type}</span>
                    </div>
                  ))}
                  {fallback.actions.length === 0 && (
                    <p className="text-sm text-gray-500">No actions configured</p>
                  )}
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addFallbackAction(fallback.id, {
                          type: 'notify',
                          config: { channel: 'email' },
                        })
                      }
                    >
                      Add Notify
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addFallbackAction(fallback.id, {
                          type: 'log',
                          config: { level: 'error' },
                        })
                      }
                    >
                      Add Log
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        addFallbackAction(fallback.id, {
                          type: 'execute_workflow',
                          config: { workflowId: '' },
                        })
                      }
                    >
                      Add Workflow
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {config.fallbacks.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No fallback paths configured</p>
              <p className="text-sm mt-1">
                Add fallback paths to handle errors gracefully
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Configuration
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
