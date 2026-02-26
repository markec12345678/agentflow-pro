import React, { useState } from "react";
import { PageBuilderPlugin } from "./context/PluginContext";

interface ImagePluginConfig {
  src?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export const ImagePlugin: PageBuilderPlugin = {
  id: "image",
  name: "Image Component",
  description: "Add images to your page with customizable properties",
  version: "1.0.0",
  author: "Page Builder",
  icon: "🖼️",
  component: ({ config, onUpdate }: { config: Record<string, any>; onUpdate: (config: Record<string, any>) => void }) => {
    const [src, setSrc] = useState(config.src || "");
    const [alt, setAlt] = useState(config.alt || "");
    const [width, setWidth] = useState(config.width || 300);
    const [height, setHeight] = useState(config.height || 200);

    return (
      <div className="p-4 border rounded">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              className="w-full p-2 border rounded"
              value={src}
              onChange={(e) => setSrc(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Alt Text
            </label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              placeholder="Image description"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Width
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                placeholder="300"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Height
              </label>
              <input
                type="number"
                className="w-full p-2 border rounded"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                placeholder="200"
              />
            </div>
          </div>
          
          <button
            className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            onClick={() => onUpdate({ ...config, src, alt, width, height })}
          >
            Update Image
          </button>
        </div>
      </div>
    );
  },
  config: {
    src: "",
    alt: "",
    width: 300,
    height: 200,
  },
};
