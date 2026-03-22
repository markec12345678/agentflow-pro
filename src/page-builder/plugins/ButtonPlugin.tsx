import React, { useState } from "react";
import { PageBuilderPlugin } from "../context/PluginContext";

interface ButtonPluginConfig {
  text?: string;
  variant?: "primary" | "secondary" | "outline-solid";
  size?: "sm" | "md" | "lg";
  href?: string;
  target?: "_blank" | "_self" | "_parent";
}

export const ButtonPlugin: PageBuilderPlugin = {
  id: "button",
  name: "Button Component",
  description: "Add customizable buttons to your page",
  version: "1.0.0",
  author: "Page Builder",
  icon: "🔘",
  component: ({ config, onUpdate }: { config: Record<string, unknown>; onUpdate: (config: Record<string, unknown>) => void }) => {
    const [text, setText] = useState<string>(typeof config.text === "string" ? config.text : "Click me");
    const [variant, setVariant] = useState<ButtonPluginConfig["variant"]>((config.variant as ButtonPluginConfig["variant"]) || "primary");
    const [size, setSize] = useState<ButtonPluginConfig["size"]>((config.size as ButtonPluginConfig["size"]) || "md");
    const [href, setHref] = useState((config.href as string) || "");
    const [target, setTarget] = useState<ButtonPluginConfig["target"]>((config.target as ButtonPluginConfig["target"]) || "_self");

    return (
      <div className="p-4 border rounded-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Button Text
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded-sm"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Click me"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Variant
            </label>
            <select
              className="w-full p-2 border rounded-sm"
              value={variant}
              onChange={(e) => setVariant(e.target.value as ButtonPluginConfig["variant"])}
              title="Button Variant"
            >
              <option value="primary">Primary</option>
              <option value="secondary">Secondary</option>
              <option value="outline">Outline</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <select
              className="w-full p-2 border rounded-sm"
              value={size}
              onChange={(e) => setSize(e.target.value as ButtonPluginConfig["size"])}
              aria-label="Button size"
              title="Select button size"
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Link URL
            </label>
            <input
              type="url"
              className="w-full p-2 border rounded-sm"
              value={href}
              onChange={(e) => setHref(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Target
            </label>
            <select
              className="w-full p-2 border rounded-sm"
              value={target}
              onChange={(e) => setTarget(e.target.value as ButtonPluginConfig["target"])}
              aria-label="Link target"
              title="Select link target"
            >
              <option value="_blank">New Window</option>
              <option value="_self">Same Window</option>
              <option value="_parent">Parent Window</option>
            </select>
          </div>

          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded-sm hover:bg-blue-600"
            onClick={() => onUpdate({ ...config, text, variant, size, href, target })}
          >
            Update Button
          </button>
        </div>
      </div>
    );
  },
  config: {
    text: "Click me",
    variant: "primary",
    size: "md",
    href: "",
    target: "_self",
  },
  isActive: true,
};
