import React, { useState } from "react";
import { PageBuilderPlugin } from "./context/PluginContext";

interface FormField {
  id: string;
  type: "text" | "email" | "number" | "textarea" | "select" | "checkbox";
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
}

interface FormPluginConfig {
  fields?: FormField[];
  submitText?: string;
  submitAction?: "submit" | "reset";
}

export const FormPlugin: PageBuilderPlugin = {
  id: "form",
  name: "Form Component",
  description: "Create customizable forms with various field types",
  version: "1.0.0",
  author: "Page Builder",
  icon: "📋",
  component: ({ config, onUpdate }: { config: Record<string, any>; onUpdate: (config: Record<string, any>) => void }) => {
    const [formData, setFormData] = useState<Record<string, any>>({});
    
    const fields = config.fields || [
      { id: "name", type: "text", label: "Name", placeholder: "Enter your name", required: true },
      { id: "email", type: "email", label: "Email", placeholder: "Enter your email" },
      { id: "message", type: "textarea", label: "Message", placeholder: "Enter your message" },
      { id: "newsletter", type: "checkbox", label: "Subscribe to newsletter" },
    ];

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onUpdate({ ...config, ...formData });
    };

    return (
      <div className="p-4 border rounded">
        <form onSubmit={handleSubmit} className="space-y-4">
          {fields.map((field) => (
            <div key={field.id} className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {field.label}
                {field.required && <span className="text-red-500">*</span>}
              </label>
              
              {field.type === "text" && (
                <input
                  type="text"
                  className="w-full p-2 border rounded"
                  value={formData[field.id] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
              
              {field.type === "email" && (
                <input
                  type="email"
                  className="w-full p-2 border rounded"
                  value={formData[field.id] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  placeholder={field.placeholder}
                  required={field.required}
                />
              )}
              
              {field.type === "textarea" && (
                <textarea
                  className="w-full p-2 border rounded"
                  value={formData[field.id] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  placeholder={field.placeholder}
                  rows={4}
                  required={field.required}
                />
              )}
              
              {field.type === "select" && (
                <select
                  className="w-full p-2 border rounded"
                  value={formData[field.id] || ""}
                  onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                  required={field.required}
                  title={field.label}
                  aria-label={field.label}
                >
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              
              {field.type === "checkbox" && (
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    value={formData[field.id] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.id]: e.target.checked })}
                    required={field.required}
                  />
                  <label className="text-sm font-medium text-gray-700">
                    {field.label}
                  </label>
                </div>
              )}
            </div>
          ))}
          
          <button
            type="submit"
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {config.submitText || "Submit"}
          </button>
        </form>
      </div>
    );
  },
  config: {
    fields: [],
    submitText: "Submit",
  },
};
