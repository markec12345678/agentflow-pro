'use client';

/**
 * AgentFlow Pro - Interactive Walkthrough
 * Step-by-step guided tours for features
 */

import { useState, useEffect } from 'react';

export interface WalkthroughStep {
  id: string;
  targetId: string;
  title: string;
  content: string;
  type?: 'info' | 'action' | 'success';
  action?: () => void;
  actionLabel?: string;
}

export interface WalkthroughConfig {
  id: string;
  name: string;
  description: string;
  steps: WalkthroughStep[];
  group?: string;
}

export const walkthroughs: WalkthroughConfig[] = [
  {
    id: 'workflow-builder-intro',
    name: 'Workflow Builder Basics',
    description: 'Learn how to build your first workflow',
    group: 'workflow',
    steps: [
      {
        id: 'step-1',
        targetId: 'node-palette',
        title: 'Step 1: Choose a Trigger',
        content: 'Start by selecting a trigger from the left panel. Triggers start your workflow (e.g., new booking, schedule, webhook).',
        type: 'info',
      },
      {
        id: 'step-2',
        targetId: 'workflow-canvas',
        title: 'Step 2: Drag to Canvas',
        content: 'Drag the trigger node and drop it onto the canvas. This is where you\'ll build your workflow.',
        type: 'action',
        actionLabel: 'Try It',
      },
      {
        id: 'step-3',
        targetId: 'node-palette',
        title: 'Step 3: Add Actions',
        content: 'Now add agent or action nodes. Connect them by dragging from one node\'s output to another\'s input.',
        type: 'info',
      },
      {
        id: 'step-4',
        targetId: 'node-config-panel',
        title: 'Step 4: Configure Nodes',
        content: 'Click on any node to configure its settings in the right panel. Set parameters, timeouts, and more.',
        type: 'action',
        actionLabel: 'Configure',
      },
      {
        id: 'step-5',
        targetId: 'workflow-save-button',
        title: 'Step 5: Save & Test',
        content: 'Click Save to store your workflow, then Test to see it in action. You\'re ready to automate!',
        type: 'success',
      },
    ],
  },
  {
    id: 'first-booking',
    name: 'Create Your First Booking',
    description: 'Learn how to manage reservations',
    group: 'reservations',
    steps: [
      {
        id: 'step-1',
        targetId: 'reservations-page',
        title: 'Reservations Overview',
        content: 'This is your reservations dashboard. View all bookings, filter by status, and manage guest information.',
        type: 'info',
      },
      {
        id: 'step-2',
        targetId: 'new-booking-button',
        title: 'Create New Booking',
        content: 'Click "New Booking" to manually create a reservation. Fill in guest details, dates, and room type.',
        type: 'action',
        actionLabel: 'Create Booking',
      },
      {
        id: 'step-3',
        targetId: 'booking-calendar',
        title: 'Calendar View',
        content: 'Switch to calendar view to see all bookings visually. Drag to adjust dates or click to edit.',
        type: 'info',
      },
      {
        id: 'step-4',
        targetId: 'guest-messaging',
        title: 'Guest Communication',
        content: 'Use the messaging feature to communicate with guests. AI can auto-generate responses!',
        type: 'info',
      },
    ],
  },
  {
    id: 'ai-agents-intro',
    name: 'AI Agents Overview',
    description: 'Discover the power of AI automation',
    group: 'agents',
    steps: [
      {
        id: 'step-1',
        targetId: 'agents-page',
        title: 'AI Agents Hub',
        content: 'Welcome to the AI Agents hub! Here you can access all your AI-powered assistants.',
        type: 'info',
      },
      {
        id: 'step-2',
        targetId: 'agent-research',
        title: 'Research Agent',
        content: 'Research Agent searches the web for information. Perfect for market research and competitor analysis.',
        type: 'info',
      },
      {
        id: 'step-3',
        targetId: 'agent-content',
        title: 'Content Agent',
        content: 'Content Agent generates SEO-optimized content. Try creating a blog post or social media update.',
        type: 'action',
        actionLabel: 'Try Content Agent',
      },
      {
        id: 'step-4',
        targetId: 'agent-communication',
        title: 'Communication Agent',
        content: 'Communication Agent handles guest messaging. Set it up to auto-respond to common inquiries.',
        type: 'info',
      },
      {
        id: 'step-5',
        targetId: 'agent-workflows',
        title: 'Combine in Workflows',
        content: 'Combine multiple agents in workflows for powerful automation. Example: Research → Content → Email.',
        type: 'success',
      },
    ],
  },
  {
    id: 'dashboard-basics',
    name: 'Dashboard Essentials',
    description: 'Understand your key metrics',
    group: 'dashboard',
    steps: [
      {
        id: 'step-1',
        targetId: 'dashboard-kpis',
        title: 'Key Performance Indicators',
        content: 'Your KPIs show critical metrics: Occupancy Rate, RevPAR, ADR, and more. Monitor these daily!',
        type: 'info',
      },
      {
        id: 'step-2',
        targetId: 'dashboard-recent-bookings',
        title: 'Recent Bookings',
        content: 'See your latest bookings here. Click any booking to view details or make changes.',
        type: 'info',
      },
      {
        id: 'step-3',
        targetId: 'dashboard-tasks',
        title: 'Tasks & Reminders',
        content: 'Stay on top of your tasks. Set reminders for check-ins, cleanings, and maintenance.',
        type: 'info',
      },
      {
        id: 'step-4',
        targetId: 'dashboard-activity-feed',
        title: 'Activity Feed',
        content: 'Real-time activity feed shows all recent events. Filter by type or search for specific events.',
        type: 'info',
      },
    ],
  },
];

interface WalkthroughPlayerProps {
  walkthroughId: string;
  onComplete?: () => void;
  onClose?: () => void;
}

export function WalkthroughPlayer({ walkthroughId, onComplete, onClose }: WalkthroughPlayerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  const walkthrough = walkthroughs.find(w => w.id === walkthroughId);
  
  if (!walkthrough) return null;

  const currentStep = walkthrough.steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / walkthrough.steps.length) * 100;

  const handleNext = () => {
    if (currentStep.action) {
      currentStep.action();
    }
    
    if (currentStepIndex < walkthrough.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setCompletedSteps([...completedSteps, currentStep.id]);
    } else {
      // Complete walkthrough
      localStorage.setItem(`walkthrough_${walkthroughId}_completed`, 'true');
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    localStorage.setItem(`walkthrough_${walkthroughId}_skipped`, 'true');
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-lg w-full shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{walkthrough.name}</h2>
            <p className="text-sm text-gray-500">{walkthrough.description}</p>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-3 bg-gray-50">
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>Step {currentStepIndex + 1} of {walkthrough.steps.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="p-6">
          <div className="mb-6">
            <div className="text-4xl mb-4">
              {currentStep.type === 'success' ? '🎉' : currentStep.type === 'action' ? '✋' : 'ℹ️'}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {currentStep.title}
            </h3>
            <p className="text-gray-700">
              {currentStep.content}
            </p>
          </div>

          {/* Step Indicator */}
          <div className="flex gap-2 mb-6">
            {walkthrough.steps.map((step, index) => (
              <div
                key={step.id}
                className={`w-3 h-3 rounded-full ${
                  index === currentStepIndex
                    ? 'bg-blue-600'
                    : completedSteps.includes(step.id)
                    ? 'bg-green-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            {currentStepIndex > 0 && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                ← Previous
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {currentStep.actionLabel || (currentStepIndex === walkthrough.steps.length - 1 ? 'Finish' : 'Next')} →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Walkthrough Launcher Component
 */
export function WalkthroughLauncher() {
  const [activeWalkthrough, setActiveWalkthrough] = useState<string | null>(null);
  const [showLauncher, setShowLauncher] = useState(false);

  // Show launcher on first visit
  useEffect(() => {
    const hasCompletedOnboarding = localStorage.getItem('onboarding_completed');
    if (!hasCompletedOnboarding) {
      setShowLauncher(true);
    }
  }, []);

  const handleStartWalkthrough = (walkthroughId: string) => {
    setActiveWalkthrough(walkthroughId);
    setShowLauncher(false);
  };

  const handleComplete = () => {
    localStorage.setItem('onboarding_completed', 'true');
    setActiveWalkthrough(null);
  };

  return (
    <>
      {/* Floating Launcher Button */}
      {showLauncher && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            onClick={() => setShowLauncher(true)}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 flex items-center justify-center text-2xl"
          >
            🎓
          </button>
        </div>
      )}

      {/* Walkthrough Selection Modal */}
      {showLauncher && !activeWalkthrough && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Welcome to AgentFlow Pro! 🎉</h2>
                <p className="text-sm text-gray-500 mt-1">Choose a guided tour to get started</p>
              </div>
              <button
                onClick={() => setShowLauncher(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 grid gap-4">
              {walkthroughs.map((walkthrough) => (
                <button
                  key={walkthrough.id}
                  onClick={() => handleStartWalkthrough(walkthrough.id)}
                  className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition-all text-left"
                >
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📚</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{walkthrough.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{walkthrough.description}</p>
                      <div className="text-xs text-gray-500 mt-2">
                        {walkthrough.steps.length} steps • {walkthrough.group}
                      </div>
                    </div>
                    <div className="text-blue-600 font-medium">Start →</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="p-6 border-t border-gray-200">
              <button
                onClick={() => setShowLauncher(false)}
                className="w-full px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Walkthrough */}
      {activeWalkthrough && (
        <WalkthroughPlayer
          walkthroughId={activeWalkthrough}
          onComplete={handleComplete}
          onClose={() => setActiveWalkthrough(null)}
        />
      )}
    </>
  );
}
