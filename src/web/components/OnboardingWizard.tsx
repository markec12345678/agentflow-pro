"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  action: string;
  href: string;
  optional?: boolean;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "welcome",
    title: "Dobrodošli v AgentFlow Pro",
    description: "Odkrijte, kako lahko AI avtomatizira vaše turistično poslovanje.",
    icon: "👋",
    action: "Začni",
    href: "#step1",
  },
  {
    id: "property",
    title: "Dodaj prvo nastanitev",
    description: "Vnesite osnovne podatke o vaši nastanitvi (hotel, apartma, itd.)",
    icon: "🏨",
    action: "Dodaj nastanitev",
    href: "/dashboard/tourism/properties",
  },
  {
    id: "generate",
    title: "Generiraj prvo vsebino",
    description: "Uporabite AI za ustvarjanje opisov, emailov ali landing strani.",
    icon: "✍️",
    action: "Generiraj",
    href: "/dashboard/tourism/generate",
  },
  {
    id: "calendar",
    title: "Nastavi koledar",
    description: "Dodajte rezervacije in sinhronizirajte z Booking.com / Airbnb.",
    icon: "📅",
    action: "Odpri koledar",
    href: "/dashboard/tourism/calendar",
  },
  {
    id: "complete",
    title: "Vse pripravljeno!",
    description: "Sedaj lahko uporabljate vse funkcionalnosti AgentFlow Pro.",
    icon: "🎉",
    action: "Vstopi v app",
    href: "/dashboard/tourism",
  },
];

interface OnboardingWizardProps {
  forceOpen?: boolean;
  onComplete?: () => void;
}

export function OnboardingWizard({ forceOpen, onComplete }: OnboardingWizardProps) {
  const [isOpen, setIsOpen] = useState(forceOpen || false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<string[]>([]);
  const [skipped, setSkipped] = useState<string[]>([]);
  const router = useRouter();

  useEffect(() => {
    // Check if user has completed onboarding
    const hasCompleted = localStorage.getItem("agentflow-tourism-onboarding");
    if (!hasCompleted && !forceOpen) {
      setIsOpen(true);
    }
  }, [forceOpen]);

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      finishOnboarding();
    }
  };

  const handleSkip = () => {
    const currentStepId = ONBOARDING_STEPS[currentStep].id;
    setSkipped([...skipped, currentStepId]);
    handleNext();
  };

  const handleStepComplete = (stepId: string) => {
    setCompleted([...completed, stepId]);
    handleNext();
  };

  const finishOnboarding = () => {
    localStorage.setItem("agentflow-tourism-onboarding", "completed");
    setIsOpen(false);
    onComplete?.();
  };

  const handleAction = () => {
    const step = ONBOARDING_STEPS[currentStep];
    if (step.id === "welcome" || step.id === "complete") {
      handleNext();
    } else {
      // Mark as completed and navigate
      handleStepComplete(step.id);
      router.push(step.href);
    }
  };

  if (!isOpen) {
    return null;
  }

  const step = ONBOARDING_STEPS[currentStep];
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
        {/* Progress Bar */}
        <div className="h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 text-center">
          {/* Step Counter */}
          <div className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Korak {currentStep + 1} od {ONBOARDING_STEPS.length}
          </div>

          {/* Icon */}
          <div className="text-6xl mb-4">{step.icon}</div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {step.title}
          </h2>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            {step.description}
          </p>

          {/* Action Button */}
          <button
            onClick={handleAction}
            className="w-full sm:w-auto px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-semibold hover:opacity-90 transition-opacity"
          >
            {step.action}
          </button>

          {/* Skip Option */}
          {!isLastStep && step.optional !== false && (
            <button
              onClick={handleSkip}
              className="block w-full sm:w-auto mx-auto mt-4 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Preskoči ta korak →
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 sm:px-8 py-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            {/* Back Button */}
            <button
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Nazaj
            </button>

            {/* Complete Later */}
            {!isLastStep && (
              <button
                onClick={finishOnboarding}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              >
                Končaj kasneje
              </button>
            )}

            {/* Dots */}
            <div className="flex gap-2">
              {ONBOARDING_STEPS.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep
                      ? "bg-blue-600"
                      : index < currentStep
                      ? "bg-blue-300"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reopen onboarding button
export function RestartOnboarding() {
  const [show, setShow] = useState(false);

  const handleRestart = () => {
    localStorage.removeItem("agentflow-tourism-onboarding");
    window.location.reload();
  };

  return (
    <>
      <button
        onClick={() => setShow(true)}
        className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400"
      >
        Zaženi onboarding znova
      </button>

      {show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-900 rounded-xl p-6 max-w-sm">
            <h3 className="font-semibold mb-2">Ponovno zaženi onboarding?</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              To bo ponastavilo vaš napredek in znova prikazalo uvodni vodnik.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShow(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600"
              >
                Prekliči
              </button>
              <button
                onClick={handleRestart}
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
              >
                Potrdi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
