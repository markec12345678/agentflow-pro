/**
 * Operational Efficiency Dashboard Component
 * Comprehensive operational management dashboard with real-time metrics
 */

"use client";

import { useState, useEffect } from 'react';
import { useOperationalEfficiency } from '@/hooks/use-operational-efficiency';
import { format, subDays, startOfWeek, endOfWeek } from 'date-fns';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';

// Lazy load recharts components (saves ~150KB on initial load)
const LineChart = dynamic(() => import('recharts').then(mod => mod.LineChart), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded">Loading chart...</div> });
const Line = dynamic(() => import('recharts').then(mod => mod.Line), { ssr: false });
const BarChart = dynamic(() => import('recharts').then(mod => mod.BarChart), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded">Loading chart...</div> });
const Bar = dynamic(() => import('recharts').then(mod => mod.Bar), { ssr: false });
const PieChart = dynamic(() => import('recharts').then(mod => mod.PieChart), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded">Loading chart...</div> });
const Pie = dynamic(() => import('recharts').then(mod => mod.Pie), { ssr: false });
const Cell = dynamic(() => import('recharts').then(mod => mod.Cell), { ssr: false });
const XAxis = dynamic(() => import('recharts').then(mod => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import('recharts').then(mod => mod.YAxis), { ssr: false });
const CartesianGrid = dynamic(() => import('recharts').then(mod => mod.CartesianGrid), { ssr: false });
const Tooltip = dynamic(() => import('recharts').then(mod => mod.Tooltip), { ssr: false });
const Legend = dynamic(() => import('recharts').then(mod => mod.Legend), { ssr: false });
const ResponsiveContainer = dynamic(() => import('recharts').then(mod => mod.ResponsiveContainer), { ssr: false, loading: () => <div className="h-64 flex items-center justify-center bg-gray-100 rounded">Loading chart...</div> });

interface OperationalDashboardProps {
  propertyId: string;
}

export default function OperationalDashboard({ propertyId }: OperationalDashboardProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'inventory' | 'maintenance' | 'housekeeping' | 'energy'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [showOptimizationModal, setShowOptimizationModal] = useState(false);

  const {
    staffSchedules,
    staffEfficiency,
    inventory,
    inventoryOptimization,
    maintenanceRequests,
    maintenanceSchedule,
    housekeepingTasks,
    housekeepingRoutes,
    housekeepingEfficiency,
    energyConsumption,
    energyOptimizations,
    operationalMetrics,
    optimizationOpportunities,
    isLoading,
    error,
    optimizeStaffSchedule,
    optimizeInventory,
    generatePurchaseOrders,
    optimizeMaintenanceSchedule,
    optimizeHousekeepingRoutes,
    optimizeEnergyUsage,
    getOperationalMetrics,
    identifyOptimizationOpportunities,
    formatCurrency,
    formatDuration,
    formatPercentage,
    getPriorityColor,
    getStatusColor,
  } = useOperationalEfficiency({ propertyId, autoRefresh: true });

  useEffect(() => {
    if (propertyId) {
      loadDashboardData();
    }
  }, [propertyId, selectedPeriod]);

  const loadDashboardData = async () => {
    const endDate = new Date();
    let startDate: Date;

    switch (selectedPeriod) {
      case '7d':
        startDate = subDays(endDate, 7);
        break;
      case '30d':
        startDate = subDays(endDate, 30);
        break;
      case '90d':
        startDate = subDays(endDate, 90);
        break;
      default:
        startDate = subDays(endDate, 30);
    }

    await Promise.all([
      getOperationalMetrics({ start: startDate, end: endDate }),
      identifyOptimizationOpportunities(),
    ]);
  };

  const handleOptimization = async (type: string) => {
    try {
      switch (type) {
        case 'staff':
          await optimizeStaffSchedule(new Date());
          break;
        case 'inventory':
          await optimizeInventory();
          break;
        case 'maintenance':
          await optimizeMaintenanceSchedule();
          break;
        case 'housekeeping':
          await optimizeHousekeepingRoutes(new Date());
          break;
        case 'energy':
          await optimizeEnergyUsage();
          break;
      }
      setShowOptimizationModal(false);
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  const renderOverviewTab = () => {
    if (!operationalMetrics) return null;

    const efficiencyData = [
      { name: 'Staff', value: operationalMetrics.productivityMetrics.laborEfficiency * 100 },
      { name: 'Equipment', value: operationalMetrics.productivityMetrics.equipmentUtilization * 100 },
      { name: 'Space', value: operationalMetrics.productivityMetrics.spaceUtilization * 100 },
    ];

    const costData = [
      { name: 'Labor', value: operationalMetrics.costMetrics.laborCostPercentage * 100 },
      { name: 'Utilities', value: operationalMetrics.costMetrics.utilityCostPercentage * 100 },
      { name: 'Maintenance', value: operationalMetrics.costMetrics.maintenanceCostPercentage * 100 },
      { name: 'Supplies', value: operationalMetrics.costMetrics.supplyCostPercentage * 100 },
    ];

    return (
      <div className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Overall Efficiency</h3>
            <p className="text-2xl font-bold text-gray-900">{formatPercentage(operationalMetrics.overallEfficiency)}</p>
            <p className="text-xs text-green-600">↑ 3% from last period</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Cost per Room</h3>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(operationalMetrics.costMetrics.costPerAvailableRoom)}</p>
            <p className="text-xs text-green-600">↓ 5% from last period</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Staff Productivity</h3>
            <p className="text-2xl font-bold text-gray-900">{operationalMetrics.productivityMetrics.roomsPerStaffHour.toFixed(1)}</p>
            <p className="text-xs text-green-600">↑ 0.3 from last period</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-600">Energy Usage</h3>
            <p className="text-2xl font-bold text-gray-900">{(operationalMetrics.sustainabilityMetrics.energyConsumption / 1000).toFixed(1)}k kWh</p>
            <p className="text-xs text-green-600">↓ 8% from last period</p>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Efficiency Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={efficiencyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {efficiencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Cost Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={costData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                <Bar dataKey="value" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Optimization Opportunities */}
        {optimizationOpportunities.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Optimization Opportunities</h3>
            <div className="space-y-3">
              {optimizationOpportunities.slice(0, 3).map((opportunity, index) => (
                <div key={opportunity.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{opportunity.title}</h4>
                    <p className="text-sm text-gray-600">{opportunity.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-green-600">{formatCurrency(opportunity.potentialSavings)}</p>
                    <p className="text-xs text-gray-500">{opportunity.paybackPeriod} months payback</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderStaffTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Staff Management</h3>
          <button
            onClick={() => handleOptimization('staff')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Optimize Schedule
          </button>
        </div>

        {/* Staff Efficiency */}
        {staffEfficiency && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Department Efficiency</h4>
            <div className="space-y-3">
              {Object.entries(staffEfficiency.departmentEfficiency).map(([dept, efficiency]) => (
                <div key={dept} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 capitalize">{dept.replace('-', ' ')}</span>
                  <div className="flex items-center">
                    <div className="w-32 bg-gray-200 rounded-full h-2 mr-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${efficiency * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600">{formatPercentage(efficiency)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Today's Schedule */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Today's Schedule</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Shift</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {staffSchedules.slice(0, 5).map((schedule) => (
                  <tr key={schedule.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Staff {schedule.staffId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{schedule.shiftType}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {format(schedule.scheduledStart, 'HH:mm')} - {format(schedule.scheduledEnd, 'HH:mm')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: getStatusColor(schedule.status) + '20', color: getStatusColor(schedule.status) }}
                      >
                        {schedule.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderInventoryTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Inventory Management</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => handleOptimization('inventory')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Optimize Inventory
            </button>
            <button
              onClick={generatePurchaseOrders}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Generate Orders
            </button>
          </div>
        </div>

        {/* Inventory Status */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Low Stock Items</h4>
            <p className="text-2xl font-bold text-red-600">
              {inventory.filter(item => item.status === 'low-stock').length}
            </p>
            <p className="text-sm text-gray-600">Need immediate attention</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Out of Stock</h4>
            <p className="text-2xl font-bold text-red-800">
              {inventory.filter(item => item.status === 'out-of-stock').length}
            </p>
            <p className="text-sm text-gray-600">Critical shortage</p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-2">Total Value</h4>
            <p className="text-2xl font-bold text-gray-900">
              {formatCurrency(inventory.reduce((sum, item) => sum + (item.currentStock * item.unitCost), 0))}
            </p>
            <p className="text-sm text-gray-600">Current inventory value</p>
          </div>
        </div>

        {/* Inventory Items */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Inventory Items</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.slice(0, 10).map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{item.category.replace('-', ' ')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.currentStock} {item.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 py-1 text-xs rounded-full"
                        style={{ backgroundColor: getStatusColor(item.status) + '20', color: getStatusColor(item.status) }}
                      >
                        {item.status.replace('-', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatCurrency(item.currentStock * item.unitCost)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderMaintenanceTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Maintenance Management</h3>
          <button
            onClick={() => handleOptimization('maintenance')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Optimize Schedule
          </button>
        </div>

        {/* Maintenance Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600">Pending Requests</h4>
            <p className="text-2xl font-bold text-yellow-600">
              {maintenanceRequests.filter(r => r.status === 'requested').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600">In Progress</h4>
            <p className="text-2xl font-bold text-blue-600">
              {maintenanceRequests.filter(r => r.status === 'in-progress').length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600">Completed Today</h4>
            <p className="text-2xl font-bold text-green-600">
              {maintenanceRequests.filter(r => r.status === 'completed' && 
                new Date(r.completedAt!).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-sm font-medium text-gray-600">Emergency</h4>
            <p className="text-2xl font-bold text-red-600">
              {maintenanceRequests.filter(r => r.priority === 'emergency' || r.priority === 'critical').length}
            </p>
          </div>
        </div>

        {/* Maintenance Requests */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Recent Requests</h4>
          <div className="space-y-3">
            {maintenanceRequests.slice(0, 5).map((request) => (
              <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">{request.title}</h5>
                  <p className="text-sm text-gray-600">{request.description}</p>
                  <p className="text-xs text-gray-500">Requested: {format(request.requestedAt, 'MMM dd, yyyy HH:mm')}</p>
                </div>
                <div className="text-right">
                  <span
                    className="px-2 py-1 text-xs rounded-full mb-2 inline-block"
                    style={{ backgroundColor: getPriorityColor(request.priority) + '20', color: getPriorityColor(request.priority) }}
                  >
                    {request.priority}
                  </span>
                  <br />
                  <span
                    className="px-2 py-1 text-xs rounded-full inline-block"
                    style={{ backgroundColor: getStatusColor(request.status) + '20', color: getStatusColor(request.status) }}
                  >
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderHousekeepingTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Housekeeping Management</h3>
          <button
            onClick={() => handleOptimization('housekeeping')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Optimize Routes
          </button>
        </div>

        {/* Housekeeping Stats */}
        {housekeepingEfficiency && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-600">Turnover Time</h4>
              <p className="text-2xl font-bold text-gray-900">{formatDuration(housekeepingEfficiency.roomTurnoverTime)}</p>
              <p className="text-xs text-green-600">↓ 2 min from average</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-600">Quality Score</h4>
              <p className="text-2xl font-bold text-gray-900">{housekeepingEfficiency.cleaningQualityScore.toFixed(1)}/5.0</p>
              <p className="text-xs text-green-600">↑ 0.2 from last week</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-600">Staff Productivity</h4>
              <p className="text-2xl font-bold text-gray-900">{housekeepingEfficiency.staffProductivity.toFixed(2)}x</p>
              <p className="text-xs text-green-600">↑ 5% from last week</p>
            </div>
          </div>
        )}

        {/* Today's Tasks */}
        <div className="bg-white rounded-lg shadow p-6">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Today's Tasks</h4>
          <div className="space-y-3">
            {housekeepingTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h5 className="font-medium text-gray-900">{task.roomNumber} - {task.taskType.replace('-', ' ')}</h5>
                  <p className="text-sm text-gray-600">Est. duration: {formatDuration(task.estimatedDuration)}</p>
                  <p className="text-xs text-gray-500">Created: {format(task.createdAt, 'HH:mm')}</p>
                </div>
                <div className="text-right">
                  <span
                    className="px-2 py-1 text-xs rounded-full"
                    style={{ backgroundColor: getPriorityColor(task.priority) + '20', color: getPriorityColor(task.priority) }}
                  >
                    {task.priority}
                  </span>
                  <br />
                  <span
                    className="px-2 py-1 text-xs rounded-full mt-1 inline-block"
                    style={{ backgroundColor: getStatusColor(task.status) + '20', color: getStatusColor(task.status) }}
                  >
                    {task.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderEnergyTab = () => {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Energy Management</h3>
          <button
            onClick={() => handleOptimization('energy')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Optimize Usage
          </button>
        </div>

        {/* Energy Stats */}
        {operationalMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-600">Energy Consumption</h4>
              <p className="text-2xl font-bold text-gray-900">
                {(operationalMetrics.sustainabilityMetrics.energyConsumption / 1000).toFixed(1)} kWh
              </p>
              <p className="text-xs text-green-600">↓ 8% from last period</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-600">Energy Cost</h4>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(operationalMetrics.costMetrics.utilityCostPercentage * operationalMetrics.costMetrics.totalOperatingCost)}
              </p>
              <p className="text-xs text-green-600">↓ 12% from last period</p>
            </div>
            
            <div className="bg-white rounded-lg shadow p-6">
              <h4 className="text-sm font-medium text-gray-600">Sustainability Score</h4>
              <p className="text-2xl font-bold text-gray-900">
                {formatPercentage(operationalMetrics.sustainabilityMetrics.sustainabilityScore)}
              </p>
              <p className="text-xs text-green-600">↑ 3% from last period</p>
            </div>
          </div>
        )}

        {/* Energy Optimizations */}
        {energyOptimizations.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6">
            <h4 className="text-md font-semibold text-gray-900 mb-4">Optimization Opportunities</h4>
            <div className="space-y-3">
              {energyOptimizations.slice(0, 3).map((optimization) => (
                <div key={optimization.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h5 className="font-medium text-gray-900">{optimization.description}</h5>
                    <p className="text-sm text-gray-600">Potential savings: {formatCurrency(optimization.potentialSavings)}</p>
                    <p className="text-xs text-gray-500">Payback: {optimization.paybackPeriod} months</p>
                  </div>
                  <div className="text-right">
                    <span
                      className="px-2 py-1 text-xs rounded-full"
                      style={{ backgroundColor: getPriorityColor(optimization.priority) + '20', color: getPriorityColor(optimization.priority) }}
                    >
                      {optimization.priority}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  if (isLoading && !operationalMetrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto text-red-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Operational Data</h3>
          <p className="text-gray-600 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">Operational Efficiency</h1>
              <span className="ml-4 text-sm text-gray-500">Property: {propertyId}</span>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                {(['7d', '30d', '90d'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setSelectedPeriod(period)}
                    className={`px-3 py-1 text-sm font-medium rounded ${
                      selectedPeriod === period
                        ? 'bg-white text-blue-600 shadow'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'staff', label: 'Staff' },
              { id: 'inventory', label: 'Inventory' },
              { id: 'maintenance', label: 'Maintenance' },
              { id: 'housekeeping', label: 'Housekeeping' },
              { id: 'energy', label: 'Energy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'staff' && renderStaffTab()}
          {activeTab === 'inventory' && renderInventoryTab()}
          {activeTab === 'maintenance' && renderMaintenanceTab()}
          {activeTab === 'housekeeping' && renderHousekeepingTab()}
          {activeTab === 'energy' && renderEnergyTab()}
        </motion.div>
      </div>
    </div>
  );
}
