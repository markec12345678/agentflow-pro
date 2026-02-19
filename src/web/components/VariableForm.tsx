"use client";

import { useState } from "react";
import type { PromptTemplate } from "@/data/prompts";
import {
  VARIABLE_LABELS,
  VARIABLE_OPTIONS,
} from "@/data/prompts";

interface VariableFormProps {
  prompt: PromptTemplate;
  onSubmit: (filledPrompt: string, customVars: Record<string, string>) => void;
  disabled?: boolean;
  initialValues?: Record<string, string>;
  submitLabel?: string;
}

function getLabel(varName: string): string {
  return VARIABLE_LABELS[varName] ?? varName.replace(/_/g, " ");
}

export function VariableForm({
  prompt,
  onSubmit,
  disabled = false,
  initialValues,
  submitLabel = "Generate",
}: VariableFormProps) {
  const variables = prompt.variables ?? [];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      variables.map((v) => [v, initialValues?.[v] ?? ""])
    )
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let filled = prompt.prompt;
    for (const [key, val] of Object.entries(values)) {
      filled = filled.replace(new RegExp(`\\{${key}[^}]*\\}`, "g"), val || "");
      filled = filled.replace(new RegExp(`\\{${key}\\}`, "g"), val || "");
    }
    onSubmit(filled, values);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
        {prompt.name} – vnesi podatke
      </h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {variables.map((varName) => {
          const options = VARIABLE_OPTIONS[varName];
          const label = getLabel(varName);
          return (
            <div key={varName}>
              <label
                htmlFor={varName}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                {label}
              </label>
              {options ? (
                <select
                  id={varName}
                  value={values[varName] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [varName]: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                  disabled={disabled}
                >
                  <option value="">Izberi...</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={varName}
                  type="text"
                  value={values[varName] ?? ""}
                  onChange={(e) =>
                    setValues((prev) => ({ ...prev, [varName]: e.target.value }))
                  }
                  placeholder={label}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  disabled={disabled}
                />
              )}
            </div>
          );
        })}
      </div>
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
      >
        {submitLabel}
      </button>
    </form>
  );
}
