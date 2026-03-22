'use client';

/**
 * Workflow Debugger UI
 * Visual workflow debugging with breakpoints and step-by-step execution
 */

import { useState, useEffect } from 'react';

interface ReplaySession {
  replayId: string;
  originalTraceId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'paused';
  steps: ReplayStep[];
  currentStepIndex: number;
  breakpoints: Breakpoint[];
}

interface ReplayStep {
  stepIndex: number;
  originalStep: {
    type: string;
    name: string;
    input?: any;
    output?: any;
    duration?: number;
  };
  status: 'pending' | 'executing' | 'completed' | 'skipped' | 'failed';
  error?: string;
}

interface Breakpoint {
  breakpointId: string;
  type: 'step' | 'error' | 'variable';
  stepIndex?: number;
  enabled: boolean;
}

export function WorkflowDebugger() {
  const [replay, setReplay] = useState<ReplaySession | null>(null);
  const [traceId, setTraceId] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [breakpoints, setBreakpoints] = useState<Breakpoint[]>([]);
  const [speed, setSpeed] = useState<'normal' | 'fast' | 'slow'>('normal');

  // Create replay session
  const createReplay = async () => {
    if (!traceId) return;

    setLoading(true);
    try {
      const response = await fetch('/api/dev/replay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          traceId,
          mode: 'step-by-step',
          pauseOnBreakpoints: true,
          pauseOnErrors: true,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setReplay(data.data);
      }
    } catch (error) {
      console.error('Failed to create replay:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start/pause replay
  const togglePlay = async () => {
    if (!replay) return;

    try {
      if (replay.status === 'paused' || replay.status === 'pending') {
        await fetch(`/api/dev/replay/${replay.replayId}/start`, { method: 'POST' });
        setReplay({ ...replay, status: 'running' });
      } else {
        await fetch(`/api/dev/replay/${replay.replayId}/pause`, { method: 'POST' });
        setReplay({ ...replay, status: 'paused' });
      }
    } catch (error) {
      console.error('Failed to toggle play:', error);
    }
  };

  // Step through execution
  const stepOver = async () => {
    if (!replay || replay.status !== 'paused') return;

    try {
      await fetch(`/api/dev/replay/${replay.replayId}/step`, { method: 'POST' });
      // Update local state
      const nextIndex = replay.currentStepIndex + 1;
      setReplay({ ...replay, currentStepIndex: nextIndex, status: 'paused' });
    } catch (error) {
      console.error('Failed to step:', error);
    }
  };

  // Toggle breakpoint
  const toggleBreakpoint = (stepIndex: number) => {
    const existing = breakpoints.find(bp => bp.stepIndex === stepIndex);
    
    if (existing) {
      setBreakpoints(breakpoints.filter(bp => bp.stepIndex !== stepIndex));
    } else {
      setBreakpoints([...breakpoints, {
        breakpointId: `bp_${stepIndex}`,
        type: 'step',
        stepIndex,
        enabled: true,
      }]);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">🐛 Workflow Debugger</h1>
        <p className="text-gray-600">
          Debug workflow executions with breakpoints and step-by-step execution
        </p>
      </div>

      {/* Trace ID Input */}
      {!replay && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <label className="block text-sm font-medium mb-2">
            Trace ID to Replay
          </label>
          <div className="flex gap-3">
            <input
              type="text"
              value={traceId}
              onChange={(e) => setTraceId(e.target.value)}
              placeholder="trace_..."
              className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={createReplay}
              disabled={loading || !traceId}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Trace'}
            </button>
          </div>
        </div>
      )}

      {/* Debugger UI */}
      {replay && (
        <div className="grid grid-cols-3 gap-6">
          {/* Controls */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Controls</h3>
            
            <div className="space-y-2">
              <button
                onClick={togglePlay}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {replay.status === 'running' ? '⏸ Pause' : '▶ Play'}
              </button>
              
              <button
                onClick={stepOver}
                disabled={replay.status !== 'paused'}
                className="w-full px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                ⏭ Step Over
              </button>
              
              <button
                onClick={() => setReplay(null)}
                className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                ✕ Stop
              </button>
            </div>

            {/* Speed Control */}
            <div className="mt-6">
              <label className="text-sm font-medium mb-2 block">Speed</label>
              <div className="flex gap-2">
                {(['slow', 'normal', 'fast'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => setSpeed(s)}
                    className={`px-3 py-1 rounded text-sm ${
                      speed === s
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200'
                    }`}
                  >
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Status:</div>
              <div className="font-semibold capitalize">{replay.status}</div>
              <div className="text-sm text-gray-600 mt-2">Step:</div>
              <div className="font-semibold">
                {replay.currentStepIndex + 1} / {replay.steps.length}
              </div>
            </div>
          </div>

          {/* Steps Timeline */}
          <div className="col-span-2 bg-white border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold mb-4">Execution Steps</h3>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {replay.steps.map((step, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedStep(index)}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    index === replay.currentStepIndex
                      ? 'bg-blue-50 border-blue-300'
                      : index === selectedStep
                      ? 'bg-gray-50 border-gray-300'
                      : 'bg-white border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {/* Breakpoint Toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBreakpoint(index);
                        }}
                        className={`w-4 h-4 rounded-full border-2 ${
                          breakpoints.some(bp => bp.stepIndex === index)
                            ? 'bg-red-600 border-red-600'
                            : 'border-gray-400 hover:border-red-600'
                        }`}
                      />
                      
                      {/* Step Info */}
                      <div>
                        <div className="font-medium">
                          {index + 1}. {step.originalStep.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {step.originalStep.type} • {step.originalStep.duration}ms
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      step.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : step.status === 'executing'
                        ? 'bg-blue-100 text-blue-800'
                        : step.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {step.status}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!replay && !loading && (
        <div className="text-center p-12 bg-gray-50 rounded-lg">
          <div className="text-5xl mb-4">🔍</div>
          <h3 className="text-lg font-semibold mb-2">No Trace Loaded</h3>
          <p className="text-gray-600">
            Enter a trace ID above to start debugging
          </p>
        </div>
      )}
    </div>
  );
}

export default WorkflowDebugger;
