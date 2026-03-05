/**
 * React Hook for Operational Efficiency Management
 */

import { useState, useEffect, useCallback } from 'react';
import {
  StaffSchedule,
  StaffPerformance,
  StaffEfficiencyAnalysis,
  InventoryItem,
  InventoryOptimization,
  InventoryTransaction,
  PurchaseOrder,
  MaintenanceRequest,
  MaintenanceSchedule,
  MaintenancePrediction,
  HousekeepingTask,
  HousekeepingRoute,
  HousekeepingEfficiency,
  EnergyConsumption,
  EnergyOptimization,
  EnergyPrediction,
  EnergySavings,
  OperationalMetrics,
  EfficiencyReport,
  OptimizationOpportunity,
  BenchmarkReport,
  OperationalEfficiencyEngine,
  DateRange,
  StaffDepartment,
  InventoryCategory,
  MaintenanceStatus,
  EnergyType,
} from '@/types/operational-efficiency';
import { OperationalEfficiencyEngineImpl } from '@/lib/operational-efficiency/OperationalEfficiencyEngine';
import { toast } from 'sonner';

interface UseOperationalEfficiencyOptions {
  propertyId?: string;
  autoRefresh?: boolean;
  refreshInterval?: number; // in minutes
}

interface UseOperationalEfficiencyReturn {
  // State
  staffSchedules: StaffSchedule[];
  staffPerformance: StaffPerformance | null;
  staffEfficiency: StaffEfficiencyAnalysis | null;
  inventory: InventoryItem[];
  inventoryOptimization: InventoryOptimization | null;
  purchaseOrders: PurchaseOrder[];
  maintenanceRequests: MaintenanceRequest[];
  maintenanceSchedule: MaintenanceSchedule | null;
  maintenancePredictions: MaintenancePrediction[];
  housekeepingTasks: HousekeepingTask[];
  housekeepingRoutes: HousekeepingRoute[];
  housekeepingEfficiency: HousekeepingEfficiency | null;
  energyConsumption: EnergyConsumption[];
  energyOptimizations: EnergyOptimization[];
  energyPrediction: EnergyPrediction | null;
  operationalMetrics: OperationalMetrics | null;
  efficiencyReport: EfficiencyReport | null;
  optimizationOpportunities: OptimizationOpportunity[];
  benchmarkReport: BenchmarkReport | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  optimizeStaffSchedule: (date: Date) => Promise<void>;
  updateStaffSchedule: (scheduleId: string, updates: Partial<StaffSchedule>) => Promise<void>;
  getStaffPerformance: (staffId: string, period: DateRange) => Promise<void>;
  analyzeStaffEfficiency: (period: DateRange) => Promise<void>;
  
  optimizeInventory: (category?: InventoryCategory) => Promise<void>;
  updateInventory: (itemId: string, quantity: number, reason: string) => Promise<void>;
  generatePurchaseOrders: () => Promise<void>;
  
  getMaintenanceRequests: (status?: MaintenanceStatus) => Promise<void>;
  optimizeMaintenanceSchedule: () => Promise<void>;
  predictMaintenanceNeeds: (period: DateRange) => Promise<void>;
  updateMaintenanceRequest: (requestId: string, updates: Partial<MaintenanceRequest>) => Promise<void>;
  
  getHousekeepingTasks: (date: Date) => Promise<void>;
  optimizeHousekeepingRoutes: (date: Date) => Promise<void>;
  updateHousekeepingTask: (taskId: string, updates: Partial<HousekeepingTask>) => Promise<void>;
  analyzeHousekeepingEfficiency: (period: DateRange) => Promise<void>;
  
  getEnergyConsumption: (period: DateRange) => Promise<void>;
  optimizeEnergyUsage: () => Promise<void>;
  predictEnergyNeeds: (period: DateRange) => Promise<void>;
  trackEnergySavings: (optimizationId: string) => Promise<void>;
  
  getOperationalMetrics: (period: DateRange) => Promise<void>;
  generateEfficiencyReport: (period: DateRange) => Promise<void>;
  identifyOptimizationOpportunities: () => Promise<void>;
  benchmarkPerformance: (industry: string) => Promise<void>;
  
  // Utility functions
  formatCurrency: (amount: number, currency?: string) => string;
  formatDuration: (minutes: number) => string;
  formatPercentage: (value: number) => string;
  calculateEfficiencyScore: (metrics: any) => number;
  getPriorityColor: (priority: string) => string;
  getStatusColor: (status: string) => string;
}

export function useOperationalEfficiency({ 
  propertyId, 
  autoRefresh = false, 
  refreshInterval = 5 
}: UseOperationalEfficiencyOptions = {}): UseOperationalEfficiencyReturn {
  const [staffSchedules, setStaffSchedules] = useState<StaffSchedule[]>([]);
  const [staffPerformance, setStaffPerformance] = useState<StaffPerformance | null>(null);
  const [staffEfficiency, setStaffEfficiency] = useState<StaffEfficiencyAnalysis | null>(null);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryOptimization, setInventoryOptimization] = useState<InventoryOptimization | null>(null);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([]);
  const [maintenanceSchedule, setMaintenanceSchedule] = useState<MaintenanceSchedule | null>(null);
  const [maintenancePredictions, setMaintenancePredictions] = useState<MaintenancePrediction[]>([]);
  const [housekeepingTasks, setHousekeepingTasks] = useState<HousekeepingTask[]>([]);
  const [housekeepingRoutes, setHousekeepingRoutes] = useState<HousekeepingRoute[]>([]);
  const [housekeepingEfficiency, setHousekeepingEfficiency] = useState<HousekeepingEfficiency | null>(null);
  const [energyConsumption, setEnergyConsumption] = useState<EnergyConsumption[]>([]);
  const [energyOptimizations, setEnergyOptimizations] = useState<EnergyOptimization[]>([]);
  const [energyPrediction, setEnergyPrediction] = useState<EnergyPrediction | null>(null);
  const [operationalMetrics, setOperationalMetrics] = useState<OperationalMetrics | null>(null);
  const [efficiencyReport, setEfficiencyReport] = useState<EfficiencyReport | null>(null);
  const [optimizationOpportunities, setOptimizationOpportunities] = useState<OptimizationOpportunity[]>([]);
  const [benchmarkReport, setBenchmarkReport] = useState<BenchmarkReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationalEngine, setOperationalEngine] = useState<OperationalEfficiencyEngine | null>(null);

  // Initialize operational efficiency engine
  useEffect(() => {
    const engine = new OperationalEfficiencyEngineImpl();
    setOperationalEngine(engine);
  }, []);

  // Load initial data when propertyId changes
  useEffect(() => {
    if (propertyId && operationalEngine) {
      loadInitialData();
    }
  }, [propertyId, operationalEngine]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh || !propertyId || !operationalEngine) return;

    const interval = setInterval(() => {
      loadInitialData();
    }, refreshInterval * 60 * 1000); // Convert minutes to milliseconds

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, propertyId, operationalEngine]);

  // Load initial data
  const loadInitialData = useCallback(async () => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      // Load current date's data
      const today = new Date();
      const [schedules, inventoryItems, requests, tasks, consumption] = await Promise.all([
        operationalEngine.getStaffSchedule(propertyId, today),
        operationalEngine.getInventoryLevels(propertyId),
        operationalEngine.getMaintenanceRequests(propertyId),
        operationalEngine.getHousekeepingTasks(propertyId, today),
        operationalEngine.getEnergyConsumption(propertyId, {
          start: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000),
          end: today,
        }),
      ]);

      setStaffSchedules(schedules);
      setInventory(inventoryItems);
      setMaintenanceRequests(requests);
      setHousekeepingTasks(tasks);
      setEnergyConsumption(consumption);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load operational data';
      setError(errorMessage);
      toast.error('Failed to load operational data');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  // Staff Management Actions
  const optimizeStaffSchedule = useCallback(async (date: Date) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const optimizedSchedules = await operationalEngine.optimizeStaffSchedule(propertyId, date);
      setStaffSchedules(optimizedSchedules);
      toast.success('Staff schedule optimized successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize staff schedule';
      setError(errorMessage);
      toast.error('Failed to optimize staff schedule');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const updateStaffSchedule = useCallback(async (scheduleId: string, updates: Partial<StaffSchedule>) => {
    if (!operationalEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedSchedule = await operationalEngine.updateStaffSchedule(scheduleId, updates);
      setStaffSchedules(prev => prev.map(s => s.id === scheduleId ? updatedSchedule : s));
      toast.success('Staff schedule updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update staff schedule';
      setError(errorMessage);
      toast.error('Failed to update staff schedule');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine]);

  const getStaffPerformance = useCallback(async (staffId: string, period: DateRange) => {
    if (!operationalEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      const performance = await operationalEngine.getStaffPerformance(staffId, period);
      setStaffPerformance(performance);
      toast.success('Staff performance data loaded');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get staff performance';
      setError(errorMessage);
      toast.error('Failed to get staff performance');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine]);

  const analyzeStaffEfficiency = useCallback(async (period: DateRange) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const analysis = await operationalEngine.analyzeStaffEfficiency(propertyId, period);
      setStaffEfficiency(analysis);
      toast.success('Staff efficiency analysis completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze staff efficiency';
      setError(errorMessage);
      toast.error('Failed to analyze staff efficiency');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  // Inventory Management Actions
  const optimizeInventory = useCallback(async (category?: InventoryCategory) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const optimization = await operationalEngine.optimizeInventory(propertyId, category);
      setInventoryOptimization(optimization);
      toast.success('Inventory optimization completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize inventory';
      setError(errorMessage);
      toast.error('Failed to optimize inventory');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const updateInventory = useCallback(async (itemId: string, quantity: number, reason: string) => {
    if (!operationalEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      const transaction = await operationalEngine.updateInventory(itemId, quantity, reason);
      
      // Update local inventory state
      setInventory(prev => prev.map(item => 
        item.id === itemId 
          ? { ...item, currentStock: Math.max(0, item.currentStock + quantity), lastUpdated: new Date() }
          : item
      ));
      
      toast.success('Inventory updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update inventory';
      setError(errorMessage);
      toast.error('Failed to update inventory');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine]);

  const generatePurchaseOrders = useCallback(async () => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const orders = await operationalEngine.generatePurchaseOrders(propertyId);
      setPurchaseOrders(orders);
      toast.success(`Generated ${orders.length} purchase orders`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate purchase orders';
      setError(errorMessage);
      toast.error('Failed to generate purchase orders');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  // Maintenance Management Actions
  const getMaintenanceRequests = useCallback(async (status?: MaintenanceStatus) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const requests = await operationalEngine.getMaintenanceRequests(propertyId, status);
      setMaintenanceRequests(requests);
      toast.success('Maintenance requests loaded');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get maintenance requests';
      setError(errorMessage);
      toast.error('Failed to get maintenance requests');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const optimizeMaintenanceSchedule = useCallback(async () => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const schedule = await operationalEngine.optimizeMaintenanceSchedule(propertyId);
      setMaintenanceSchedule(schedule);
      toast.success('Maintenance schedule optimized');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize maintenance schedule';
      setError(errorMessage);
      toast.error('Failed to optimize maintenance schedule');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const predictMaintenanceNeeds = useCallback(async (period: DateRange) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const predictions = await operationalEngine.predictMaintenanceNeeds(propertyId, period);
      setMaintenancePredictions(predictions);
      toast.success('Maintenance predictions generated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to predict maintenance needs';
      setError(errorMessage);
      toast.error('Failed to predict maintenance needs');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const updateMaintenanceRequest = useCallback(async (requestId: string, updates: Partial<MaintenanceRequest>) => {
    if (!operationalEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedRequest = await operationalEngine.updateMaintenanceRequest(requestId, updates);
      setMaintenanceRequests(prev => prev.map(r => r.id === requestId ? updatedRequest : r));
      toast.success('Maintenance request updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update maintenance request';
      setError(errorMessage);
      toast.error('Failed to update maintenance request');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine]);

  // Housekeeping Management Actions
  const getHousekeepingTasks = useCallback(async (date: Date) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const tasks = await operationalEngine.getHousekeepingTasks(propertyId, date);
      setHousekeepingTasks(tasks);
      toast.success('Housekeeping tasks loaded');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get housekeeping tasks';
      setError(errorMessage);
      toast.error('Failed to get housekeeping tasks');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const optimizeHousekeepingRoutes = useCallback(async (date: Date) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const routes = await operationalEngine.optimizeHousekeepingRoutes(propertyId, date);
      setHousekeepingRoutes(routes);
      toast.success('Housekeeping routes optimized');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize housekeeping routes';
      setError(errorMessage);
      toast.error('Failed to optimize housekeeping routes');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const updateHousekeepingTask = useCallback(async (taskId: string, updates: Partial<HousekeepingTask>) => {
    if (!operationalEngine) return;

    setIsLoading(true);
    setError(null);

    try {
      const updatedTask = await operationalEngine.updateHousekeepingTask(taskId, updates);
      setHousekeepingTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
      toast.success('Housekeeping task updated successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update housekeeping task';
      setError(errorMessage);
      toast.error('Failed to update housekeeping task');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine]);

  const analyzeHousekeepingEfficiency = useCallback(async (period: DateRange) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const efficiency = await operationalEngine.analyzeHousekeepingEfficiency(propertyId, period);
      setHousekeepingEfficiency(efficiency);
      toast.success('Housekeeping efficiency analysis completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to analyze housekeeping efficiency';
      setError(errorMessage);
      toast.error('Failed to analyze housekeeping efficiency');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  // Energy Management Actions
  const getEnergyConsumption = useCallback(async (period: DateRange) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const consumption = await operationalEngine.getEnergyConsumption(propertyId, period);
      setEnergyConsumption(consumption);
      toast.success('Energy consumption data loaded');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get energy consumption';
      setError(errorMessage);
      toast.error('Failed to get energy consumption');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const optimizeEnergyUsage = useCallback(async () => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const optimizations = await operationalEngine.optimizeEnergyUsage(propertyId);
      setEnergyOptimizations(optimizations);
      toast.success('Energy usage optimization completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to optimize energy usage';
      setError(errorMessage);
      toast.error('Failed to optimize energy usage');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const predictEnergyNeeds = useCallback(async (period: DateRange) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const prediction = await operationalEngine.predictEnergyNeeds(propertyId, period);
      setEnergyPrediction(prediction);
      toast.success('Energy needs prediction completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to predict energy needs';
      setError(errorMessage);
      toast.error('Failed to predict energy needs');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const trackEnergySavings = useCallback(async (optimizationId: string) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const savings = await operationalEngine.trackEnergySavings(propertyId, optimizationId);
      toast.success(`Energy savings tracked: $${savings.actualSavings.toFixed(2)}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to track energy savings';
      setError(errorMessage);
      toast.error('Failed to track energy savings');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  // Analytics and Insights Actions
  const getOperationalMetrics = useCallback(async (period: DateRange) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const metrics = await operationalEngine.getOperationalMetrics(propertyId, period);
      setOperationalMetrics(metrics);
      toast.success('Operational metrics loaded');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get operational metrics';
      setError(errorMessage);
      toast.error('Failed to get operational metrics');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const generateEfficiencyReport = useCallback(async (period: DateRange) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const report = await operationalEngine.generateEfficiencyReport(propertyId, period);
      setEfficiencyReport(report);
      toast.success('Efficiency report generated');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate efficiency report';
      setError(errorMessage);
      toast.error('Failed to generate efficiency report');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const identifyOptimizationOpportunities = useCallback(async () => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const opportunities = await operationalEngine.identifyOptimizationOpportunities(propertyId);
      setOptimizationOpportunities(opportunities);
      toast.success('Optimization opportunities identified');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to identify optimization opportunities';
      setError(errorMessage);
      toast.error('Failed to identify optimization opportunities');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  const benchmarkPerformance = useCallback(async (industry: string) => {
    if (!operationalEngine || !propertyId) return;

    setIsLoading(true);
    setError(null);

    try {
      const report = await operationalEngine.benchmarkPerformance(propertyId, industry);
      setBenchmarkReport(report);
      toast.success('Performance benchmark completed');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to benchmark performance';
      setError(errorMessage);
      toast.error('Failed to benchmark performance');
    } finally {
      setIsLoading(false);
    }
  }, [operationalEngine, propertyId]);

  // Utility functions
  const formatCurrency = useCallback((amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }, []);

  const formatDuration = useCallback((minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }, []);

  const formatPercentage = useCallback((value: number): string => {
    return `${(value * 100).toFixed(1)}%`;
  }, []);

  const calculateEfficiencyScore = useCallback((metrics: any): number => {
    // Mock efficiency calculation
    const weights = {
      productivity: 0.3,
      quality: 0.25,
      cost: 0.2,
      sustainability: 0.15,
      satisfaction: 0.1,
    };
    
    let score = 0;
    let totalWeight = 0;
    
    for (const [key, weight] of Object.entries(weights)) {
      if (metrics[key] !== undefined) {
        score += metrics[key] * weight;
        totalWeight += weight;
      }
    }
    
    return totalWeight > 0 ? score / totalWeight : 0;
  }, []);

  const getPriorityColor = useCallback((priority: string): string => {
    const colors = {
      low: '#10b981',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#7c3aed',
      urgent: '#dc2626',
    };
    return colors[priority as keyof typeof colors] || '#6b7280';
  }, []);

  const getStatusColor = useCallback((status: string): string => {
    const colors = {
      pending: '#f59e0b',
      in_progress: '#3b82f6',
      completed: '#10b981',
      cancelled: '#ef4444',
      approved: '#10b981',
      rejected: '#ef4444',
      draft: '#6b7280',
    };
    return colors[status as keyof typeof colors] || '#6b7280';
  }, []);

  return {
    // State
    staffSchedules,
    staffPerformance,
    staffEfficiency,
    inventory,
    inventoryOptimization,
    purchaseOrders,
    maintenanceRequests,
    maintenanceSchedule,
    maintenancePredictions,
    housekeepingTasks,
    housekeepingRoutes,
    housekeepingEfficiency,
    energyConsumption,
    energyOptimizations,
    energyPrediction,
    operationalMetrics,
    efficiencyReport,
    optimizationOpportunities,
    benchmarkReport,
    isLoading,
    error,
    
    // Actions
    optimizeStaffSchedule,
    updateStaffSchedule,
    getStaffPerformance,
    analyzeStaffEfficiency,
    
    optimizeInventory,
    updateInventory,
    generatePurchaseOrders,
    
    getMaintenanceRequests,
    optimizeMaintenanceSchedule,
    predictMaintenanceNeeds,
    updateMaintenanceRequest,
    
    getHousekeepingTasks,
    optimizeHousekeepingRoutes,
    updateHousekeepingTask,
    analyzeHousekeepingEfficiency,
    
    getEnergyConsumption,
    optimizeEnergyUsage,
    predictEnergyNeeds,
    trackEnergySavings,
    
    getOperationalMetrics,
    generateEfficiencyReport,
    identifyOptimizationOpportunities,
    benchmarkPerformance,
    
    // Utility functions
    formatCurrency,
    formatDuration,
    formatPercentage,
    calculateEfficiencyScore,
    getPriorityColor,
    getStatusColor,
  };
}
