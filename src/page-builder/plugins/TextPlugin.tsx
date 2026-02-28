import React, { useState } from "react";
import { PageBuilderPlugin } from "./context/PluginContext";

export const TextPlugin: PageBuilderPlugin = {
  id: "text",
  name: "Text Component",
  description: "Add editable text components to your page",
  version: "1.0.0",
  author: "Page Builder",
  icon: "📝",
  component: ({ config, onUpdate }: { config: Record<string, unknown>; onUpdate: (config: Record<string, unknown>) => void }) => {
    const [text, setText] = useState(config.text || "");

    return (
      <div className="p-4 border rounded">
        <textarea
          className="w-full p-2 border rounded"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter your text here..."
        />
        <button
          className="mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          onClick={() => onUpdate({ ...config, text })}
        >
          Update Text
        </button>
      </div>
    );
  },
  config: {
    defaultText: "",
    fontSize: 16,
    color: "#000000",
  },
};
