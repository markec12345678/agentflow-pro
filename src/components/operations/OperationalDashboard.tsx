/**
 * Operational Efficiency Dashboard
 * 
 * Main dashboard for all operational modules:
 * - Staff Scheduling
 * - Inventory Management
 * - Maintenance Planning
 * - Housekeeping Optimization
 * - Energy Management
 */

'use client';

import React, { useState } from 'react';

const styles = {
  container: 'max-w-7xl mx-auto p-6 space-y-6',
  card: 'bg-white rounded-xl shadow-md p-6 border border-gray-200',
  header: 'flex items-center justify-between mb-6',
  grid: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4',
  button: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors',
  tabs: 'flex space-x-2 border-b border-gray-200 mb-6',
  tab: 'px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 border-b-2 border-transparent hover:border-gray-300',
  tabActive: 'text-blue-600 border-blue-600'
};

export const OperationalDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: '📊 Overview' },
    { id: 'staff', label: '👥 Staff' },
    { id: 'inventory', label: '📦 Inventory' },
    { id: 'maintenance', label: '🔧 Maintenance' },
    { id: 'housekeeping', label: '🧹 Housekeeping' },
    { id: 'energy', label: '⚡ Energy' }
  ];

  return (
    <div className={styles.container} data-testid="operations-dashboard">
      {/* Header */}
      <div className={styles.header}>
        <h1 className="text-2xl font-bold text-gray-900">Operational Efficiency Dashboard</h1>
        <button className={styles.button} onClick={() => window.location.reload()}>
          🔄 Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.tab} ${activeTab === tab.id ? styles.tabActive : ''}`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'staff' && <StaffTab />}
      {activeTab === 'inventory' && <InventoryTab />}
      {activeTab === 'maintenance' && <MaintenanceTab />}
      {activeTab === 'housekeeping' && <HousekeepingTab />}
      {activeTab === 'energy' && <EnergyTab />}
    </div>
  );
};

// Overview Tab
const OverviewTab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className={styles.grid}>
        <StatCard title="Staff Scheduled" value="24" icon="👥" change="+2 today" />
        <StatCard title="Low Stock Items" value="5" icon="📦" change="Needs reorder" />
        <StatCard title="Maintenance Tasks" value="8" icon="🔧" change="3 urgent" />
        <StatCard title="Rooms to Clean" value="12" icon="🧹" change="4 VIP" />
        <StatCard title="Energy Usage" value="€487" icon="⚡" change="-12% vs avg" />
        <StatCard title="Occupancy" value="78%" icon="🏨" change="+5% vs yesterday" />
      </div>

      <div className={styles.card}>
        <h3 className="text-lg font-semibold mb-4">Today's Highlights</h3>
        <ul className="space-y-2 text-sm">
          <li>✅ Staff schedule optimized for 78% occupancy</li>
          <li>⚠️ 5 items below reorder point - purchase orders generated</li>
          <li>🔧 3 urgent maintenance tasks pending</li>
          <li>🌟 4 VIP rooms requiring special attention</li>
          <li>💡 Energy consumption 12% below average - great job!</li>
        </ul>
      </div>
    </div>
  );
};

// Staff Tab
const StaffTab: React.FC = () => {
  return (
    <div className="space-y-4" data-testid="staff-schedule">
      <div className={styles.card}>
        <h3 className="text-lg font-semibold mb-4">Today's Schedule</h3>
        <div className="space-y-2">
          <StaffRow name="Maria Novak" role="Housekeeping" shift="08:00 - 16:00" status="confirmed" />
          <StaffRow name="John Smith" role="Front Desk" shift="07:00 - 15:00" status="confirmed" />
          <StaffRow name="Ana Horvat" role="Maintenance" shift="09:00 - 17:00" status="confirmed" />
          <StaffRow name="Peter Kos" role="Restaurant" shift="11:00 - 19:00" status="confirmed" />
        </div>
      </div>
    </div>
  );
};

const StaffRow: React.FC<{ name: string; role: string; shift: string; status: string }> = ({ name, role, shift, status }) => (
  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
    <div>
      <p className="font-medium">{name}</p>
      <p className="text-sm text-gray-600">{role}</p>
    </div>
    <div className="text-right">
      <p className="text-sm">{shift}</p>
      <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">{status}</span>
    </div>
  </div>
);

// Inventory Tab
const InventoryTab: React.FC = () => {
  return (
    <div className="space-y-4" data-testid="inventory-list">
      <div className={styles.card}>
        <h3 className="text-lg font-semibold mb-4">Low Stock Items</h3>
        <div className="space-y-2">
          <InventoryItem name="Shampoo 500ml" current={5} min={10} max={50} />
          <InventoryItem name="Soap Bars" current={15} min={20} max={100} />
          <InventoryItem name="Coffee Capsules" current={8} min={15} max={60} />
          <InventoryItem name="Toilet Paper" current={20} min={30} max={120} />
          <InventoryItem name="Cleaning Solution" current={3} min={5} max={20} />
        </div>
        <button className={`${styles.button} mt-4 w-full`}>📦 Generate Purchase Orders</button>
      </div>
    </div>
  );
};

const InventoryItem: React.FC<{ name: string; current: number; min: number; max: number }> = ({ name, current, min, max }) => (
  <div className="p-3 bg-gray-50 rounded-lg">
    <div className="flex justify-between items-center mb-2">
      <span className="font-medium">{name}</span>
      <span className={`text-sm px-2 py-1 rounded-full ${current < min ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}`}>
        {current} / {max}
      </span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div className="bg-red-500 h-2 rounded-full" style={{ width: `${(current / max) * 100}%` }} />
    </div>
  </div>
);

// Maintenance Tab
const MaintenanceTab: React.FC = () => {
  return (
    <div className="space-y-4" data-testid="maintenance-tasks">
      <div className={styles.card}>
        <h3 className="text-lg font-semibold mb-4">Pending Tasks</h3>
        <MaintenanceTask priority="critical" location="Room 305" description="AC not cooling" type="emergency" />
        <MaintenanceTask priority="high" location="Lobby" description="Light fixture flickering" type="corrective" />
        <MaintenanceTask priority="medium" location="Gym" description="Monthly equipment inspection" type="preventive" />
        <MaintenanceTask priority="low" location="Garden" description="Lawn mowing" type="preventive" />
      </div>
    </div>
  );
};

const MaintenanceTask: React.FC<{ priority: string; location: string; description: string; type: string }> = ({ priority, location, description, type }) => {
  const priorityColors: Record<string, string> = {
    critical: 'bg-red-100 text-red-800',
    high: 'bg-orange-100 text-orange-800',
    medium: 'bg-yellow-100 text-yellow-800',
    low: 'bg-green-100 text-green-800'
  };

  return (
    <div className="p-3 bg-gray-50 rounded-lg mb-2">
      <div className="flex justify-between items-start mb-2">
        <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[priority]}`}>{priority}</span>
        <span className="text-xs text-gray-600">{type}</span>
      </div>
      <p className="font-medium">{location}</p>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
};

// Housekeeping Tab
const HousekeepingTab: React.FC = () => {
  return (
    <div className="space-y-4" data-testid="housekeeping-status">
      <div className={styles.card}>
        <h3 className="text-lg font-semibold mb-4">Rooms Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">45</p>
            <p className="text-sm text-gray-600">Clean</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-2xl font-bold text-yellow-600">12</p>
            <p className="text-sm text-gray-600">In Progress</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">8</p>
            <p className="text-sm text-gray-600">Dirty</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">4</p>
            <p className="text-sm text-gray-600">VIP</p>
          </div>
        </div>
        <button className={styles.button}>🧹 Optimize Route</button>
      </div>
    </div>
  );
};

// Energy Tab
const EnergyTab: React.FC = () => {
  return (
    <div className="space-y-4" data-testid="energy-consumption">
      <div className={styles.card}>
        <h3 className="text-lg font-semibold mb-4">Energy Consumption</h3>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <EnergyMetric type="Electricity" current="245 kWh" avg="268 kWh" change="-8.6%" />
          <EnergyMetric type="Water" current="1,240 L" avg="1,450 L" change="-14.5%" />
          <EnergyMetric type="Gas" current="89 m³" avg="95 m³" change="-6.3%" />
          <EnergyMetric type="HVAC" current="€312" avg="€356" change="-12.4%" />
        </div>
        <button className={styles.button}>💡 View Saving Recommendations</button>
      </div>
    </div>
  );
};

const EnergyMetric: React.FC<{ type: string; current: string; avg: string; change: string }> = ({ type, current, avg, change }) => (
  <div className="p-4 bg-gray-50 rounded-lg">
    <p className="text-sm text-gray-600 mb-1">{type}</p>
    <p className="text-xl font-bold">{current}</p>
    <div className="flex justify-between text-xs mt-2">
      <span className="text-gray-600">Avg: {avg}</span>
      <span className="text-green-600 font-medium">{change}</span>
    </div>
  </div>
);

// Stat Card Component
const StatCard: React.FC<{ title: string; value: string; icon: string; change: string }> = ({ title, value, icon, change }) => (
  <div className={styles.card}>
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs px-2 py-1 rounded-full ${change.includes('+') || change.includes('urgent') || change.includes('Needs') ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
        {change}
      </span>
    </div>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    <p className="text-sm text-gray-600">{title}</p>
  </div>
);

export default OperationalDashboard;
