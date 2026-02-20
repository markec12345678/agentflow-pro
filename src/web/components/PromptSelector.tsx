"use client";

import { useState, useEffect } from "react";
import {
  PROMPTS,
  CATEGORY_LABELS,
  type PromptTemplate,
} from "@/data/prompts";

interface PromptSelectorProps {
  selectedPrompt: PromptTemplate | null;
  onSelect: (prompt: PromptTemplate | null) => void;
  defaultCategory?: string;
}

const CATEGORY_KEYS = ["all", ...Object.keys(CATEGORY_LABELS)] as const;

export function PromptSelector({
  selectedPrompt,
  onSelect,
  defaultCategory = "all",
}: PromptSelectorProps) {
  const [category, setCategory] = useState<string>(defaultCategory);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (defaultCategory !== "all") {
      setCategory(defaultCategory);
    }
  }, [defaultCategory]);

  const filtered =
    category === "all"
      ? PROMPTS
      : PROMPTS.filter((p) => p.category === category);

  const _categoryLabel = category === "all" ? "All" : CATEGORY_LABELS[category];

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-left focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label={selectedPrompt ? `Selected: ${selectedPrompt.name}` : "Select prompt template"}
        >
          <span>
            {selectedPrompt
              ? selectedPrompt.name
              : "Select Prompt"}
          </span>
          <span className="text-gray-500">{isOpen ? "▲" : "▼"}</span>
        </button>
        {selectedPrompt && (
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white focus-visible:ring-2 focus-visible:ring-blue-500"
            aria-label="Clear prompt selection"
          >
            Clear
          </button>
        )}
      </div>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div className="absolute top-full left-0 right-0 mt-1 z-20 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-lg max-h-80 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-gray-200 dark:border-gray-600 flex flex-wrap gap-1">
              {CATEGORY_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={`px-2 py-1 text-sm rounded focus-visible:ring-2 focus-visible:ring-blue-500 ${category === key
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                    }`}
                  aria-label={`Filter by ${key === "all" ? "all categories" : CATEGORY_LABELS[key]}`}
                  aria-pressed={category === key}
                >
                  {key === "all" ? "All" : CATEGORY_LABELS[key]}
                </button>
              ))}
            </div>
            <div className="overflow-y-auto flex-1 p-2">
              {filtered.map((prompt) => (
                <button
                  key={prompt.id}
                  type="button"
                  onClick={() => {
                    onSelect(prompt);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded text-sm ${selectedPrompt?.id === prompt.id
                    ? "bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200"
                    : "hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white"
                    }`}
                >
                  <span className="font-medium">{prompt.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {CATEGORY_LABELS[prompt.category]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
