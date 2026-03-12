'use client';

/**
 * AgentFlow Pro - Smart Tooltip
 * Contextual tooltips with AI-powered help
 */

import { useState, useEffect, useRef } from 'react';

interface TooltipProps {
  targetId: string;
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  videoUrl?: string;
  learnMoreUrl?: string;
}

export function SmartTooltip({
  targetId,
  title,
  content,
  type = 'info',
  videoUrl,
  learnMoreUrl,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const targetRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find target element
    const target = document.getElementById(targetId);
    if (target) {
      targetRef.current = target;

      const showTooltip = () => {
        const rect = target.getBoundingClientRect();
        setPosition({
          top: rect.bottom + window.scrollY + 10,
          left: rect.left + window.scrollX - 100,
        });
        setIsVisible(true);
      };

      const hideTooltip = () => {
        setIsVisible(false);
      };

      target.addEventListener('mouseenter', showTooltip);
      target.addEventListener('mouseleave', hideTooltip);
      target.addEventListener('focus', showTooltip);
      target.addEventListener('blur', hideTooltip);

      return () => {
        target.removeEventListener('mouseenter', showTooltip);
        target.removeEventListener('mouseleave', hideTooltip);
        target.removeEventListener('focus', showTooltip);
        target.removeEventListener('blur', hideTooltip);
      };
    }
  }, [targetId]);

  if (!isVisible) return null;

  const typeColors = {
    info: 'bg-blue-600',
    warning: 'bg-yellow-600',
    error: 'bg-red-600',
    success: 'bg-green-600',
  };

  const typeIcons = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌',
    success: '✅',
  };

  return (
    <div
      className="fixed z-50 w-80 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
      style={{ top: position.top, left: position.left }}
    >
      {/* Header */}
      <div className={`${typeColors[type]} px-4 py-3 text-white`}>
        <div className="flex items-center gap-2">
          <span className="text-lg">{typeIcons[type]}</span>
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-sm text-gray-700 mb-4">{content}</p>

        {/* Video Tutorial */}
        {videoUrl && (
          <div className="mb-4">
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors">
              <span className="text-4xl">▶️</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Watch tutorial</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {learnMoreUrl && (
            <a
              href={learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 text-center"
            >
              Learn More
            </a>
          )}
          <button
            onClick={() => setIsVisible(false)}
            className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200"
          >
            Got It
          </button>
        </div>

        {/* Don't Show Again */}
        <div className="mt-3 text-center">
          <label className="flex items-center justify-center gap-2 text-xs text-gray-500 cursor-pointer">
            <input type="checkbox" className="rounded" />
            Don't show again
          </label>
        </div>
      </div>
    </div>
  );
}

/**
 * Tooltip Registry - Manage all tooltips in the app
 */
export interface TooltipConfig {
  targetId: string;
  title: string;
  content: string;
  type?: 'info' | 'warning' | 'error' | 'success';
  videoUrl?: string;
  learnMoreUrl?: string;
  group?: string;
}

export const tooltipRegistry: TooltipConfig[] = [
  // Workflow Builder Tooltips
  {
    targetId: 'workflow-canvas',
    title: 'Workflow Canvas',
    content: 'Drag nodes from the left panel and drop them here to build your workflow. Connect nodes by dragging from one node\'s output to another\'s input.',
    type: 'info',
    group: 'workflow-builder',
  },
  {
    targetId: 'node-palette',
    title: 'Node Palette',
    content: 'Choose from different node types: Triggers start workflows, Agents execute AI tasks, Actions perform operations, Conditions add logic branches.',
    type: 'info',
    group: 'workflow-builder',
  },
  {
    targetId: 'node-config-panel',
    title: 'Node Configuration',
    content: 'Configure each node\'s settings here. Click on any node in the canvas to see its configuration options.',
    type: 'info',
    group: 'workflow-builder',
  },
  {
    targetId: 'workflow-save-button',
    title: 'Save Workflow',
    content: 'Click Save to store your workflow. You can come back and edit it anytime.',
    type: 'success',
    group: 'workflow-builder',
  },
  {
    targetId: 'workflow-test-button',
    title: 'Test Workflow',
    content: 'Test your workflow to see how it executes. This runs a simulation without affecting real data.',
    type: 'info',
    group: 'workflow-builder',
  },
  
  // Dashboard Tooltips
  {
    targetId: 'dashboard-kpi-occupancy',
    title: 'Occupancy Rate',
    content: 'Percentage of rooms occupied. Higher is better! Industry average is 60-70%.',
    type: 'info',
    group: 'dashboard',
  },
  {
    targetId: 'dashboard-kpi-revpar',
    title: 'RevPAR',
    content: 'Revenue Per Available Room. Key metric for hotel performance. Calculated as ADR × Occupancy Rate.',
    type: 'info',
    group: 'dashboard',
    learnMoreUrl: 'https://example.com/revpar-guide',
  },
  {
    targetId: 'dashboard-kpi-adr',
    title: 'ADR',
    content: 'Average Daily Rate. Average revenue per occupied room. Track this to optimize pricing.',
    type: 'info',
    group: 'dashboard',
  },
  
  // Agent Tooltips
  {
    targetId: 'agent-research',
    title: 'Research Agent',
    content: 'Automatically searches the web and extracts information. Perfect for market research, competitor analysis, and data gathering.',
    type: 'info',
    group: 'agents',
  },
  {
    targetId: 'agent-content',
    title: 'Content Agent',
    content: 'Generates high-quality content including blog posts, emails, and social media. SEO-optimized and brand-compliant.',
    type: 'info',
    group: 'agents',
  },
  {
    targetId: 'agent-communication',
    title: 'Communication Agent',
    content: 'Handles guest messaging automatically. Supports multiple languages and can respond to reviews.',
    type: 'info',
    group: 'agents',
  },
];

/**
 * Get tooltips for a specific group
 */
export function getTooltipsByGroup(group: string): TooltipConfig[] {
  return tooltipRegistry.filter(t => t.group === group);
}

/**
 * Tooltip Provider Component
 */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  const [activeTooltips, setActiveTooltips] = useState<TooltipConfig[]>([]);

  useEffect(() => {
    // Show welcome tooltip on first visit
    const hasVisited = localStorage.getItem('agentflow_visited');
    if (!hasVisited) {
      const welcomeTooltip: TooltipConfig = {
        targetId: 'dashboard',
        title: 'Welcome to AgentFlow Pro! 🎉',
        content: 'Start by exploring the dashboard or create your first workflow. Click "Got It" to dismiss this message.',
        type: 'success',
      };
      setActiveTooltips([welcomeTooltip]);
      localStorage.setItem('agentflow_visited', 'true');
    }
  }, []);

  return (
    <>
      {children}
      {activeTooltips.map((tooltip, index) => (
        <SmartTooltip
          key={index}
          {...tooltip}
        />
      ))}
    </>
  );
}
