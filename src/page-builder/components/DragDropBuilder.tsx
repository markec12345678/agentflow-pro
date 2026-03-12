"use client";

import { useCallback, useState } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { usePlugins } from "../context/PluginContext";
import { Button } from "@/web/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/web/components/ui/card";
import { Badge } from "@/web/components/ui/badge";
import {
  GripVertical,
  Trash2,
  Settings,
  Eye,
  Save,
  Undo,
  Redo,
  Copy,
  Plus,
  Move,
  Layers,
  Code,
  Download,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

interface PageComponent {
  id: string;
  type: "header" | "text" | "image" | "button" | "form" | "gallery" | "video" | "spacer";
  content: Record<string, unknown>;
  styles: Record<string, unknown>;
  position: { x: number; y: number };
  children?: PageComponent[];
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
  const [history, setHistory] = useState<PageComponent[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [previewMode, setPreviewMode] = useState(false);
  const [gridSize, setGridSize] = useState(20);
  const [snapToGrid, setSnapToGrid] = useState(true);

  const { getAllPlugins } = usePlugins();

  const addToHistory = useCallback((newComponents: PageComponent[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newComponents);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      onComponentsChange(history[historyIndex - 1]);
      toast.success('Undo successful');
    }
  }, [history, historyIndex, onComponentsChange]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      onComponentsChange(history[historyIndex + 1]);
      toast.success('Redo successful');
    }
  }, [history, historyIndex, onComponentsChange]);

  const moveComponent = useCallback((dragIndex: number, hoverIndex: number) => {
    const newComponents = [...components];
    const draggedComponent = newComponents[dragIndex];
    newComponents.splice(dragIndex, 1);
    newComponents.splice(hoverIndex, 0, draggedComponent);
    onComponentsChange(newComponents);
    addToHistory(newComponents);
  }, [components, onComponentsChange, addToHistory]);

  const updateComponent = useCallback((id: string, updates: Partial<PageComponent>) => {
    const newComponents = components.map(comp =>
      comp.id === id ? { ...comp, ...updates } : comp
    );
    onComponentsChange(newComponents);
    addToHistory(newComponents);
  }, [components, onComponentsChange, addToHistory]);

  const deleteComponent = useCallback((id: string) => {
    const newComponents = components.filter(comp => comp.id !== id);
    onComponentsChange(newComponents);
    addToHistory(newComponents);
    toast.success('Component deleted');
  }, [components, onComponentsChange, addToHistory]);

  const duplicateComponent = useCallback((id: string) => {
    const index = components.findIndex(comp => comp.id === id);
    if (index === -1) return;
    
    const component = components[index];
    const duplicate = {
      ...component,
      id: `comp-${Date.now()}`,
      position: {
        x: component.position.x + 20,
        y: component.position.y + 20,
      },
    };
    
    const newComponents = [...components];
    newComponents.splice(index + 1, 0, duplicate);
    onComponentsChange(newComponents);
    addToHistory(newComponents);
    toast.success('Component duplicated');
  }, [components, onComponentsChange, addToHistory]);

  const addComponent = useCallback((type: PageComponent['type']) => {
    const newComponent: PageComponent = {
      id: `comp-${Date.now()}`,
      type,
      content: {
        text: type === 'header' ? 'New Header' : type === 'text' ? 'Add your text here' : '',
        src: type === 'image' ? '/placeholder.jpg' : undefined,
      },
      styles: {
        fontSize: type === 'header' ? '2rem' : '1rem',
        color: '#000000',
        backgroundColor: 'transparent',
      },
      position: { x: 0, y: components.length * 100 },
    };
    
    const newComponents = [...components, newComponent];
    onComponentsChange(newComponents);
    addToHistory(newComponents);
    toast.success('Component added');
  }, [components, onComponentsChange, addToHistory]);

  const handleSave = useCallback(() => {
    // Save to database or export
    const json = JSON.stringify(components, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-design-${Date.now()}.json`;
    a.click();
    toast.success('Design exported');
  }, [components]);

  const snapPosition = useCallback((value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  }, [snapToGrid, gridSize]);

  const plugins = getAllPlugins();

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        {/* Left Sidebar - Components */}
        <div className="w-64 border-r bg-white dark:bg-gray-800 p-4 overflow-y-auto">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Components
          </h3>
          
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addComponent('header')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Header
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addComponent('text')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Text
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addComponent('image')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Image
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addComponent('button')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Button
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addComponent('form')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Form
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addComponent('gallery')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Gallery
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addComponent('video')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Video
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              onClick={() => addComponent('spacer')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Spacer
            </Button>
          </div>

          {plugins.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Plugins</h4>
              <div className="space-y-1">
                {plugins.map(plugin => (
                  <Badge key={plugin.id} variant="secondary" className="w-full justify-start">
                    {plugin.name}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Main Canvas */}
        <div className="flex-1 flex flex-col">
          {/* Toolbar */}
          <div className="border-b bg-white dark:bg-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleUndo}
                disabled={historyIndex <= 0}
              >
                <Undo className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
              >
                <Redo className="w-4 h-4" />
              </Button>
              <div className="h-6 w-px bg-gray-300 mx-2" />
              <Button
                size="sm"
                variant={previewMode ? 'default' : 'outline'}
                onClick={() => setPreviewMode(!previewMode)}
              >
                <Eye className="w-4 h-4 mr-2" />
                {previewMode ? 'Edit' : 'Preview'}
              </Button>
              <div className="h-6 w-px bg-gray-300 mx-2" />
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={snapToGrid}
                  onChange={e => setSnapToGrid(e.target.checked)}
                  className="rounded"
                />
                Snap to Grid ({gridSize}px)
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import
              </Button>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="outline">
                <Code className="w-4 h-4 mr-2" />
                Export Code
              </Button>
            </div>
          </div>

          {/* Canvas Area */}
          <div className="flex-1 overflow-auto p-8">
            <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 shadow-lg min-h-[800px] p-8">
              {components.map((component, index) => (
                <div
                  key={component.id}
                  className={`relative mb-4 p-4 border-2 rounded-lg transition-all ${
                    selectedComponent === component.id
                      ? 'border-blue-500 ring-2 ring-blue-200'
                      : 'border-transparent hover:border-gray-300'
                  } ${previewMode ? '' : 'cursor-move'}`}
                  onClick={() => onComponentSelect(component.id)}
                >
                  {!previewMode && (
                    <div className="absolute -right-10 top-0 flex flex-col gap-1 opacity-0 hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateComponent(component.id);
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteComponent(component.id);
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                      >
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mb-2">
                    <GripVertical className="w-4 h-4 text-gray-400" />
                    <Badge variant="outline">{component.type}</Badge>
                    <span className="text-xs text-gray-500">
                      Position: ({component.position.x}, {component.position.y})
                    </span>
                  </div>
                  <div>
                    {component.type === 'header' && (
                      <h2 style={component.styles as any}>
                        {component.content.text as string}
                      </h2>
                    )}
                    {component.type === 'text' && (
                      <p style={component.styles as any}>
                        {component.content.text as string}
                      </p>
                    )}
                    {component.type === 'image' && (
                      <img
                        src={component.content.src as string}
                        alt="Component"
                        style={component.styles as any}
                        className="max-w-full"
                      />
                    )}
                    {component.type === 'button' && (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded"
                        style={component.styles as any}
                      >
                        {component.content.text as string}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {components.length === 0 && (
                <div className="text-center py-20 text-gray-500">
                  <Layers className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Drag components here or click from the sidebar</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar - Properties */}
        {selectedComponent && (
          <div className="w-80 border-l bg-white dark:bg-gray-800 p-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Properties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Text</label>
                  <input
                    type="text"
                    value={String(components.find(c => c.id === selectedComponent)?.content.text || '')}
                    onChange={e => updateComponent(selectedComponent, {
                      content: { ...components.find(c => c.id === selectedComponent)?.content, text: e.target.value }
                    })}
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Font Size</label>
                  <input
                    type="text"
                    value={String(components.find(c => c.id === selectedComponent)?.styles.fontSize || '')}
                    onChange={e => updateComponent(selectedComponent, {
                      styles: { ...components.find(c => c.id === selectedComponent)?.styles, fontSize: e.target.value }
                    })}
                    className="w-full mt-1 p-2 border rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Color</label>
                  <input
                    type="color"
                    value={String(components.find(c => c.id === selectedComponent)?.styles.color || '#000000')}
                    onChange={e => updateComponent(selectedComponent, {
                      styles: { ...components.find(c => c.id === selectedComponent)?.styles, color: e.target.value }
                    })}
                    className="w-full mt-1 h-10 border rounded-md"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Background</label>
                  <input
                    type="color"
                    value={String(components.find(c => c.id === selectedComponent)?.styles.backgroundColor || '#ffffff')}
                    onChange={e => updateComponent(selectedComponent, {
                      styles: { ...components.find(c => c.id === selectedComponent)?.styles, backgroundColor: e.target.value }
                    })}
                    className="w-full mt-1 h-10 border rounded-md"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DndProvider>
  );
}

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
                        className="mt-2 w-full py-1.5 text-xs bg-blue-500 hover:bg-blue-600 text-white rounded-sm"
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
                          <div className="text-xs bg-gray-100 px-2 py-1 rounded-sm mb-1">
                            {component.type}
                          </div>
                          <div className="font-medium">
                            {typeof component.content?.text === "string"
                              ? component.content.text
                              : component.type}
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
                        value={
                          (() => {
                            const t = components.find(c => c.id === selectedComponent)?.content?.text;
                            return typeof t === "string" ? t : "";
                          })()
                        }
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
                        onChange={(e) => {
                          const pos = components.find(c => c.id === selectedComponent)?.position;
                          updateComponent(selectedComponent, {
                            position: {
                              x: parseInt(e.target.value) || 0,
                              y: pos?.y ?? 0
                            }
                          });
                        }}
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
                        onChange={(e) => {
                          const pos = components.find(c => c.id === selectedComponent)?.position;
                          updateComponent(selectedComponent, {
                            position: {
                              x: pos?.x ?? 0,
                              y: parseInt(e.target.value) || 0
                            }
                          });
                        }}
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
