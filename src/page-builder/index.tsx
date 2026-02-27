import { PluginProvider, usePlugins } from "./context/PluginContext";
import { DragDropBuilder } from "./components/DragDropBuilder";
import { TextPlugin } from "./plugins/TextPlugin";
import { ImagePlugin } from "./plugins/ImagePlugin";
import { ButtonPlugin } from "./plugins/ButtonPlugin";
import { FormPlugin } from "./plugins/FormPlugin";

export default function PageBuilder() {
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
          <DragDropBuilder />
        </div>
      </div>
    </PluginProvider>
  );
}

export { PluginProvider, usePlugins, DragDropBuilder, TextPlugin, ImagePlugin, ButtonPlugin, FormPlugin };
