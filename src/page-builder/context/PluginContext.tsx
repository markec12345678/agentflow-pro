import { ReactNode } from "react";

export interface PageBuilderPlugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  icon: string;
  component: ReactNode;
  config: Record<string, any>;
  isActive: boolean;
}

export interface PluginContext {
  plugins: PageBuilderPlugin[];
  registerPlugin: (plugin: PageBuilderPlugin) => void;
  unregisterPlugin: (pluginId: string) => void;
  getPlugin: (pluginId: string) => PageBuilderPlugin | undefined;
  getAllPlugins: () => PageBuilderPlugin[];
}

export const PluginContext = React.createContext<PluginContext | null>(null);

export function PluginProvider({ children }: { children: ReactNode }) {
  const [plugins, setPlugins] = useState<PageBuilderPlugin[]>([]);

  const registerPlugin = useCallback((plugin: PageBuilderPlugin) => {
    setPlugins(prev => [...prev, plugin]);
  }, []);

  const unregisterPlugin = useCallback((pluginId: string) => {
    setPlugins(prev => prev.filter(p => p.id !== pluginId));
  }, []);

  const getPlugin = useCallback((pluginId: string) => {
    return plugins.find(p => p.id === pluginId);
  }, [plugins]);

  const getAllPlugins = useCallback(() => {
    return plugins;
  }, [plugins]);

  return (
    <PluginContext.Provider value={{
      plugins,
      registerPlugin,
      unregisterPlugin,
      getPlugin,
      getAllPlugins,
    }}>
      {children}
    </PluginContext.Provider>
  );
}

export function usePlugins() {
  const context = React.useContext(PluginContext);
  
  if (!context) {
    throw new Error('usePlugins must be used within a PluginProvider');
  }

  return context;
}
