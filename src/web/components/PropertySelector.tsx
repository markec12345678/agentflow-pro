"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Skeleton } from "@/web/components/Skeleton";

interface Property {
  id: string;
  name: string;
  location: string | null;
  type: string | null;
  capacity: number | null;
}

interface PropertySelectorProps {
  value: string | null;
  onChange: (propertyId: string | null) => void;
  className?: string;
}

export function PropertySelector({ value, onChange, className = "" }: PropertySelectorProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/tourism/properties")
      .then((r) => r.json())
      .then((data) => setProperties(data.properties ?? []))
      .catch(() => setProperties([]))
      .finally(() => setLoading(false));
  }, []);

  const selected = value ? properties.find((p) => p.id === value) : null;
  const label = selected ? selected.name : "Vse nastanitve";

  const handleSelect = (id: string | null) => {
    onChange(id);
    setOpen(false);
  };

  if (loading) {
    return (
      <Skeleton
        className={`h-10 w-40 ${className}`}
      />
    );
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 px-3 py-2 min-h-[44px] text-sm text-neutral-900 dark:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span>Nastanitev:</span>
        <span className="font-medium">{label}</span>
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <ul
            role="listbox"
            className="absolute left-0 top-full z-20 mt-1 min-w-[180px] rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 shadow-lg py-1"
          >
            <li>
              <button
                type="button"
                role="option"
                onClick={() => handleSelect(null)}
                className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${!value ? "bg-blue-50 dark:bg-blue-900/30 font-medium" : ""}`}
              >
                Vse nastanitve
              </button>
            </li>
            {properties.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  role="option"
                  onClick={() => handleSelect(p.id)}
                  className={`block w-full px-3 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800 ${value === p.id ? "bg-blue-50 dark:bg-blue-900/30 font-medium" : ""}`}
                >
                  {p.name}
                  {p.location && (
                    <span className="ml-1 text-neutral-500">({p.location})</span>
                  )}
                </button>
              </li>
            ))}
            <li className="border-t border-neutral-200 dark:border-neutral-700 mt-1 pt-1">
              <Link
                href="/dashboard/tourism/properties"
                className="block px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-neutral-100 dark:hover:bg-neutral-800"
                onClick={() => setOpen(false)}
              >
                + Upravljaj nastanitve
              </Link>
            </li>
          </ul>
        </>
      )}
    </div>
  );
}
