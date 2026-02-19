"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

const STORAGE_KEY = "agentflow-tour-seen";

export interface TourStep {
  target: string;
  title: string;
  content: string;
}

const DASHBOARD_STEPS: TourStep[] = [
  {
    target: "[data-feature-tour='dashboard-new-workflow']",
    title: "Create Workflows",
    content:
      "Create custom AI workflows with Research, Content, Code, and Deploy agents. Click here to get started.",
  },
  {
    target: "[data-feature-tour='dashboard-agents']",
    title: "Your AI Agents",
    content:
      "Monitor your 4 core agents: Research, Content, Code, and Deploy. Each can be added to workflows.",
  },
  {
    target: "[data-feature-tour='dashboard-quick-actions']",
    title: "Quick Actions",
    content:
      "Jump to workflows, upgrade your plan, or read the docs. Everything you need in one place.",
  },
];

export const TOURISM_STEPS: TourStep[] = [
  {
    target: "#prompt-selector",
    title: "Tourism Prompts",
    content:
      "Izberi med 5 specializiranimi prompti za turizem: Booking opisi, Airbnb zgodbe, destinacijski vodiči...",
  },
  {
    target: "#language-select",
    title: "Multi-language",
    content: "Generiraj vsebino v SL, EN, DE, IT ali HR z enim klikom.",
  },
  {
    target: "#export-btn",
    title: "Export",
    content: "Kopiraj, prenesi ali direktno objavi na Booking/Airbnb.",
  },
];

interface FeatureTourProps {
  steps?: TourStep[];
  storageKey?: string;
  forceOpen?: boolean;
  onComplete?: () => void;
}

export function FeatureTour({
  steps = DASHBOARD_STEPS,
  storageKey = STORAGE_KEY,
  forceOpen = false,
  onComplete,
}: FeatureTourProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const markSeen = useCallback(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "1");
    }
  }, [storageKey]);

  const close = useCallback(() => {
    setIsOpen(false);
    markSeen();
    onComplete?.();
  }, [markSeen, onComplete]);

  const updateTargetRect = useCallback(() => {
    const selector = steps[stepIndex]?.target;
    if (!selector) return;
    const el = document.querySelector(selector);
    if (el) {
      setTargetRect(el.getBoundingClientRect());
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      setTargetRect(null);
    }
  }, [stepIndex, steps]);

  useEffect(() => {
    if (!isOpen) return;
    updateTargetRect();
    const handleResize = () => updateTargetRect();
    window.addEventListener("resize", handleResize);
    const timer = setTimeout(updateTargetRect, 100);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
    };
  }, [isOpen, stepIndex, updateTargetRect]);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      setStepIndex(0);
      return;
    }
    if (typeof window === "undefined") return;
    const seen = localStorage.getItem(storageKey);
    if (!seen) {
      setIsOpen(true);
    }
  }, [forceOpen, storageKey]);

  const handleNext = () => {
    if (stepIndex >= steps.length - 1) {
      close();
    } else {
      setStepIndex((i) => i + 1);
    }
  };

  const handlePrev = () => {
    if (stepIndex > 0) {
      setStepIndex((i) => i - 1);
    }
  };

  const handleSkip = () => close();

  if (!isOpen) return null;

  const step = steps[stepIndex];
  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  const tooltipContent = (
    <div className="fixed left-1/2 -translate-x-1/2 bottom-[10vh] z-[10000] w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6">
      {step && (
        <>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-6">
            {step.content}
          </p>
        </>
      )}
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {stepIndex + 1} of {steps.length}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSkip}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            aria-label="Skip tour"
          >
            Skip Tour
          </button>
          {!isFirst && (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              aria-label="Previous step"
            >
              Previous
            </button>
          )}
          <button
            type="button"
            onClick={handleNext}
            className="px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            aria-label={isLast ? "Finish tour" : "Next step"}
          >
            {isLast ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Overlay - pointer-events-none so page buttons are clickable */}
      <div
        className="fixed inset-0 z-[9999] pointer-events-none"
        role="dialog"
        aria-label="Feature tour"
        aria-modal="true"
      >
        <div
          className="absolute inset-0 bg-black/50"
          aria-hidden="true"
        />
        {targetRect && (
          <>
            <style
              dangerouslySetInnerHTML={{
                __html: `.tour-highlight-box{position:absolute;top:${targetRect.top - 4}px;left:${targetRect.left - 4}px;width:${targetRect.width + 8}px;height:${targetRect.height + 8}px}`,
              }}
            />
            <div className="absolute tour-highlight-box border-2 border-blue-500 rounded-lg bg-transparent shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
          </>
        )}
      </div>
      {/* Tooltip in portal - sibling to overlay, receives clicks */}
      {typeof document !== "undefined" &&
        createPortal(tooltipContent, document.body)}
    </>
  );
}

