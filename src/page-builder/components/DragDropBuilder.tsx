"use client";

import { useCallback } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { usePlugins } from "../context/PluginContext";

interface PageComponent {
  id: string;
  type: "header" | "text" | "image" | "button" | "form" | "gallery";
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  position: { x: number; y: number };
}

interface DragDropBuilderProps {
  components: PageComponent[];
  onComponentsChange: (components: PageComponent[]) => void;
  selectedComponent: string | null;
  onComponentSelect: (id: string | null) => void;
}

export function DragDropBuilder({
  components,
  onComponentsChange,
  selectedComponent,
  onComponentSelect
}: DragDropBuilderProps) {
  const moveComponent = useCallback((dragIndex: number, hoverIndex: number) => {
    const newComponents = [...components];
    const draggedComponent = newComponents[dragIndex];
    newComponents.splice(dragIndex, 1);
    newComponents.splice(hoverIndex, 0, draggedComponent);
    onComponentsChange(newComponents);
  }, [components, onComponentsChange]);

  const updateComponent = useCallback((id: string, updates: Partial<PageComponent>) => {
    const newComponents = components.map(comp =>
      comp.id === id ? { ...comp, ...updates } : comp
    );
    onComponentsChange(newComponents);
  }, [components, onComponentsChange]);

  const deleteComponent = useCallback((id: string) => {
    const newComponents = components.filter(comp => comp.id !== id);
    onComponentsChange(newComponents);
  }, [components, onComponentsChange]);

  const { getAllPlugins } = usePlugins();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Page Builder
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Component Library */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-4">
                  Komponente
                </h2>
                <div className="space-y-2">
                  {getAllPlugins().map((plugin) => (
                    <div
                      key={plugin.id}
                      className={`p-3 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${selectedComponent === plugin.id ? "bg-blue-100 dark:bg-blue-900/40" : ""
                        }`}
                    >
                      <div
                        onClick={() => onComponentSelect(plugin.id)}
                        className="pointer-events-auto"
                      >
                        <div className="text-2xl mb-2">{plugin.icon}</div>
                        <div className="text-sm font-medium">{plugin.name}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newComp: PageComponent = {
                            id: `comp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                            type: plugin.id as PageComponent["type"],
                            content: (plugin as { config?: Record<string, unknown> }).config
                              ? { ...(plugin as { config?: Record<string, unknown> }).config }
                              : {},
                            styles: {},
                            position: {
                              x: components.length * 60,
                              y: components.length * 40,
                            },
                          };
                          onComponentsChange([...components, newComp]);
                          onComponentSelect(newComp.id);
                        }}
                        className="mt-2 w-full py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded"
                      >
                        Dodaj na platno
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6 min-h-96">
                <h2 className="text-lg font-semibold mb-4">
                  Platno
                </h2>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 min-h-96">
                  {components.length === 0 ? (
                    <div className="text-center text-gray-500 mt-20">
                      <div className="text-6xl mb-4">🎨</div>
                      <p>Povlecite komponente sem za začetek</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {components.map((component, _index) => (
                        <div
                          key={component.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => onComponentSelect(component.id)}
                          className={`absolute border rounded p-2 bg-white dark:bg-gray-800 cursor-pointer ${selectedComponent === component.id
                            ? "border-blue-500 ring-2 ring-blue-200"
                            : "border-gray-300 dark:border-gray-600"
                            }`}
                          style={{
                            left: `${component.position.x}px`,
                            top: `${component.position.y}px`,
                            width: "200px",
                          }}
                        >
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded mb-1">
                            {component.type}
                          </div>
                          <div className="font-medium">
                            {component.content?.text || component.type}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Properties Panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-lg font-semibold mb-4">
                  Lastnosti
                </h2>
                {selectedComponent && (
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="dragdrop-content" className="block text-sm font-medium text-gray-700 mb-1">
                        Vsebina
                      </label>
                      <textarea
                        id="dragdrop-content"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        rows={4}
                        value={components.find(c => c.id === selectedComponent)?.content?.text || ""}
                        onChange={(e) => updateComponent(selectedComponent, {
                          content: { text: e.target.value }
                        })}
                        aria-label="Vsebina komponente"
                      />
                    </div>
                    <div>
                      <label htmlFor="dragdrop-posx" className="block text-sm font-medium text-gray-700 mb-1">
                        Položaj X
                      </label>
                      <input
                        id="dragdrop-posx"
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={components.find(c => c.id === selectedComponent)?.position?.x || 0}
                        onChange={(e) => updateComponent(selectedComponent, {
                          position: {
                            ...components.find(c => c.id === selectedComponent)?.position,
                            x: parseInt(e.target.value)
                          }
                        })}
                        aria-label="Položaj X"
                      />
                    </div>
                    <div>
                      <label htmlFor="dragdrop-posy" className="block text-sm font-medium text-gray-700 mb-1">
                        Položaj Y
                      </label>
                      <input
                        id="dragdrop-posy"
                        type="number"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={components.find(c => c.id === selectedComponent)?.position?.y || 0}
                        onChange={(e) => updateComponent(selectedComponent, {
                          position: {
                            ...components.find(c => c.id === selectedComponent)?.position,
                            y: parseInt(e.target.value)
                          }
                        })}
                        aria-label="Položaj Y"
                      />
                    </div>
                    <button
                      className="w-full bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600"
                      onClick={() => deleteComponent(selectedComponent)}
                    >
                      Izbriši komponento
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
