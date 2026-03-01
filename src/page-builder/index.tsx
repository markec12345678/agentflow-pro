"use client";

import { useState } from "react";
import { PluginProvider } from "./context/PluginContext";
import { DragDropBuilder } from "./components/DragDropBuilder";
import { TextPlugin } from "./plugins/TextPlugin";
import { ImagePlugin } from "./plugins/ImagePlugin";
import { ButtonPlugin } from "./plugins/ButtonPlugin";
import { FormPlugin } from "./plugins/FormPlugin";

type PageComponent = {
  id: string;
  type: "header" | "text" | "image" | "button" | "form" | "gallery";
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  position: { x: number; y: number };
};

export default function PageBuilder() {
  const [components, setComponents] = useState<PageComponent[]>([]);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);

  return (
    <PluginProvider>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Professional Page Builder
          </h1>
          <p className="text-gray-600 mb-8">
            Create beautiful web pages with drag & drop interface and extensible plugin system
          </p>
          <DragDropBuilder
            components={components}
            onComponentsChange={setComponents}
            selectedComponent={selectedComponent}
            onComponentSelect={setSelectedComponent}
          />
        </div>
      </div>
    </PluginProvider>
  );
}

export { PluginProvider, usePlugins } from "./context/PluginContext";
export { DragDropBuilder } from "./components/DragDropBuilder";
export { TextPlugin } from "./plugins/TextPlugin";
export { ImagePlugin } from "./plugins/ImagePlugin";
export { ButtonPlugin } from "./plugins/ButtonPlugin";
export { FormPlugin } from "./plugins/FormPlugin";
