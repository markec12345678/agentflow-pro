/**
 * Operational Efficiency Engine for AgentFlow Pro
 * 
 * Comprehensive operations management:
 * - Staff scheduling with optimization
 * - Inventory management with auto-reordering
 * - Maintenance planning with predictive analytics
 * - Housekeeping optimization with route planning
 * - Energy management with cost tracking
 * 
 * @version 1.0.0
 * @author AgentFlow Pro Team
 */

import { prisma } from '@/database/schema';

// ============================================================================
// TYPES
// ============================================================================

export interface StaffSchedule {
  id: string;
  employeeId: string;
  employeeName: string;
  role: string;
  date: Date;
  shiftStart: string; // HH:MM
  shiftEnd: string; // HH:MM
  department: 'front-desk' | 'housekeeping' | 'maintenance' | 'restaurant' | 'spa' | 'management';
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed';
  notes?: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minStock: number;
  maxStock: number;
  reorderPoint: number;
  unit: string;
  supplier?: string;
  costPerUnit: number;
  lastOrdered?: Date;
  location?: string;
}

export interface MaintenanceTask {
  id: string;
  type: 'preventive' | 'corrective' | 'emergency' | 'inspection';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  location: string;
  description: string;
  assignedTo?: string;
  estimatedDuration: number; // minutes
  scheduledDate?: Date;
  completedDate?: Date;
  cost?: number;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  roomNumber: string;
  type: 'checkout' | 'stay-over' | 'deep-clean' | 'turndown';
  priority: 'low' | 'medium' | 'high' | 'vip';
  status: 'pending' | 'assigned' | 'in-progress' | 'completed' | 'inspection';
  assignedTo?: string;
  estimatedDuration: number; // minutes
  startedAt?: Date;
  completedAt?: Date;
  inspectedBy?: string;
  notes?: string;
}

export interface EnergyReading {
  id: string;
  timestamp: Date;
  type: 'electricity' | 'water' | 'gas' | 'hvac';
  consumption: number;
  unit: string;
  cost: number;
  area: string;
  anomaly?: boolean;
}

// ============================================================================
// STAFF SCHEDULING
// ============================================================================

/**
 * Optimize staff scheduling based on:
 * - Occupancy forecasts
 * - Labor regulations
 * - Employee preferences
 * - Skill requirements
 */
export async function optimizeStaffSchedule(
  department: string,
  date: Date,
  occupancyForecast: number
): Promise<StaffSchedule[]> {
  try {
    // Get all available employees for department
    const employees = await prisma.employee.findMany({
      where: {
        department: department as any,
        status: 'active'
      },
      include: {
        availability: true,
        skills: true
      }
    });

    // Calculate required staff based on occupancy
    const requiredStaff = calculateRequiredStaff(department, occupancyForecast);

    // Generate optimal schedule
    const schedule: StaffSchedule[] = [];

    for (const employee of employees) {
      if (schedule.length >= requiredStaff) break;

      // Check availability
      const isAvailable = await checkEmployeeAvailability(employee.id, date);
      if (!isAvailable) continue;

      // Check labor regulations (max hours, rest periods)
      const compliant = await checkLaborCompliance(employee.id, date);
      if (!compliant) continue;

      // Create schedule entry
      schedule.push({
        id: `schedule-${Date.now()}-${employee.id}`,
        employeeId: employee.id,
        employeeName: employee.name,
        role: employee.role,
        date,
        shiftStart: '08:00',
        shiftEnd: '16:00',
        department: department as any,
        status: 'scheduled'
      });
    }

    return schedule;
  } catch (error) {
    console.error('[Operational Efficiency] optimizeStaffSchedule error:', error);
    return [];
  }
}

/**
 * Calculate required staff based on occupancy and department
 */
function calculateRequiredStaff(department: string, occupancy: number): number {
  const ratios: Record<string, { base: number; perRoom: number }> = {
    housekeeping: { base: 2, perRoom: 0.5 }, // 1 staff per 2 rooms
    'front-desk': { base: 1, perRoom: 0.05 }, // 1 staff per 20 rooms
    maintenance: { base: 1, perRoom: 0.02 }, // 1 staff per 50 rooms
    restaurant: { base: 2, perRoom: 0.1 }, // 1 staff per 10 rooms
    spa: { base: 1, perRoom: 0.05 }
  };

  const ratio = ratios[department] || { base: 1, perRoom: 0.05 };
  return Math.ceil(ratio.base + (occupancy * ratio.perRoom));
}

/**
 * Check employee availability for date
 */
async function checkEmployeeAvailability(
  employeeId: string,
  date: Date
): Promise<boolean> {
  const existingSchedule = await prisma.staffSchedule.findFirst({
    where: {
      employeeId,
      date: {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999))
      },
      status: { not: 'cancelled' }
    }
  });

  return !existingSchedule;
}

/**
 * Check labor law compliance
 */
async function checkLaborCompliance(
  employeeId: string,
  date: Date
): Promise<boolean> {
  // Check max weekly hours (40 hours in Slovenia)
  const weekStart = new Date(date);
  weekStart.setDate(date.getDate() - date.getDay());

  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);

  const weeklyHours = await prisma.staffSchedule.aggregate({
    where: {
      employeeId,
      date: {
        gte: weekStart,
        lte: weekEnd
      },
      status: { not: 'cancelled' }
    },
    _sum: {
      estimatedHours: true
    }
  });

  if ((weeklyHours._sum.estimatedHours || 0) > 40) {
    return false;
  }

  // Check rest period (12 hours between shifts)
  const previousShift = await prisma.staffSchedule.findFirst({
    where: {
      employeeId,
      date: {
        lt: date
      },
      status: { not: 'cancelled' }
    },
    orderBy: {
      date: 'desc'
    }
  });

  if (previousShift) {
    const restHours = (date.getTime() - new Date(previousShift.date).getTime()) / (1000 * 60 * 60);
    if (restHours < 12) {
      return false;
    }
  }

  return true;
}

// ============================================================================
// INVENTORY MANAGEMENT
// ============================================================================

/**
 * Check inventory levels and generate reorder recommendations
 */
export async function checkInventoryLevels(): Promise<{
  itemsToReorder: InventoryItem[];
  totalEstimatedCost: number;
}> {
  try {
    const items = await prisma.inventoryItem.findMany({
      where: {
        status: 'active'
      }
    });

    const itemsToReorder: InventoryItem[] = [];
    let totalEstimatedCost = 0;

    for (const item of items) {
      if (item.currentStock <= item.reorderPoint) {
        itemsToReorder.push(item);
        const reorderQuantity = item.maxStock - item.currentStock;
        totalEstimatedCost += reorderQuantity * item.costPerUnit;
      }
    }

    return {
      itemsToReorder,
      totalEstimatedCost
    };
  } catch (error) {
    console.error('[Operational Efficiency] checkInventoryLevels error:', error);
    return { itemsToReorder: [], totalEstimatedCost: 0 };
  }
}

/**
 * Auto-generate purchase orders for low stock items
 */
export async function generatePurchaseOrders(): Promise<{
  orders: any[];
  totalCost: number;
}> {
  const { itemsToReorder, totalEstimatedCost } = await checkInventoryLevels();

  const orders = [];

  // Group by supplier
  const bySupplier = new Map<string, InventoryItem[]>();
  for (const item of itemsToReorder) {
    const supplier = item.supplier || 'General';
    if (!bySupplier.has(supplier)) {
      bySupplier.set(supplier, []);
    }
    bySupplier.get(supplier)!.push(item);
  }

  // Create purchase orders
  for (const [supplier, items] of bySupplier.entries()) {
    const order = await prisma.purchaseOrder.create({
      data: {
        supplier,
        status: 'pending',
        items: items.map(item => ({
          itemId: item.id,
          quantity: item.maxStock - item.currentStock,
          costPerUnit: item.costPerUnit
        })),
        totalAmount: items.reduce(
          (sum, item) => sum + (item.maxStock - item.currentStock) * item.costPerUnit,
          0
        ),
        expectedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      }
    });

    orders.push(order);
  }

  return {
    orders,
    totalCost: totalEstimatedCost
  };
}

/**
 * Track inventory usage patterns
 */
export async function trackInventoryUsage(
  itemId: string,
  days: number = 30
): Promise<{
  averageDailyUsage: number;
  projectedStockoutDate?: Date;
  recommendedReorderPoint: number;
}> {
  const usageRecords = await prisma.inventoryUsage.findMany({
    where: {
      itemId,
      date: {
        gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    },
    orderBy: {
      date: 'desc'
    }
  });

  const totalUsage = usageRecords.reduce((sum, r) => sum + r.quantity, 0);
  const averageDailyUsage = totalUsage / Math.max(usageRecords.length, 1);

  // Get current stock
  const item = await prisma.inventoryItem.findUnique({
    where: { id: itemId }
  });

  if (!item) {
    return {
      averageDailyUsage: 0,
      recommendedReorderPoint: 0
    };
  }

  // Project stockout date
  const daysUntilStockout = item.currentStock / averageDailyUsage;
  const projectedStockoutDate = averageDailyUsage > 0
    ? new Date(Date.now() + daysUntilStockout * 24 * 60 * 60 * 1000)
    : undefined;

  // Calculate recommended reorder point (lead time + safety stock)
  const leadTimeDays = 7; // Default 7 days
  const safetyStockDays = 3; // 3 days safety
  const recommendedReorderPoint = Math.ceil(
    averageDailyUsage * (leadTimeDays + safetyStockDays)
  );

  return {
    averageDailyUsage,
    projectedStockoutDate,
    recommendedReorderPoint
  };
}

// ============================================================================
// MAINTENANCE PLANNING
// ============================================================================

/**
 * Generate preventive maintenance schedule
 */
export async function generatePreventiveMaintenanceSchedule(): Promise<MaintenanceTask[]> {
  try {
    const assets = await prisma.asset.findMany({
      where: {
        status: 'active'
      },
      include: {
        maintenanceHistory: {
          orderBy: {
            scheduledDate: 'desc'
          },
          take: 1
        }
      }
    });

    const tasks: MaintenanceTask[] = [];

    for (const asset of assets) {
      const lastMaintenance = asset.maintenanceHistory[0];
      const nextDue = calculateNextMaintenanceDue(asset, lastMaintenance);

      if (nextDue && nextDue <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)) {
        tasks.push({
          id: `maintenance-${Date.now()}-${asset.id}`,
          type: 'preventive',
          priority: 'medium',
          status: 'pending',
          location: asset.location,
          description: `Preventive maintenance for ${asset.name}`,
          estimatedDuration: asset.maintenanceDuration || 60,
          scheduledDate: nextDue
        });
      }
    }

    return tasks;
  } catch (error) {
    console.error('[Operational Efficiency] generatePreventiveMaintenanceSchedule error:', error);
    return [];
  }
}

/**
 * Calculate next maintenance due date
 */
function calculateNextMaintenanceDue(
  asset: any,
  lastMaintenance?: any
): Date | null {
  if (!asset.maintenanceInterval) {
    return null;
  }

  const baseDate = lastMaintenance?.completedDate || asset.installationDate || new Date();
  const nextDue = new Date(baseDate);

  switch (asset.maintenanceInterval) {
    case 'daily':
      nextDue.setDate(nextDue.getDate() + 1);
      break;
    case 'weekly':
      nextDue.setDate(nextDue.getDate() + 7);
      break;
    case 'monthly':
      nextDue.setMonth(nextDue.getMonth() + 1);
      break;
    case 'quarterly':
      nextDue.setMonth(nextDue.getMonth() + 3);
      break;
    case 'annually':
      nextDue.setFullYear(nextDue.getFullYear() + 1);
      break;
  }

  return nextDue;
}

/**
 * Predict maintenance needs based on usage patterns
 */
export async function predictMaintenanceNeeds(
  assetId: string
): Promise<{
  predictedFailureDate?: Date;
  confidence: number;
  recommendedAction: string;
}> {
  // Get maintenance history
  const history = await prisma.assetMaintenance.findMany({
    where: { assetId },
    orderBy: { scheduledDate: 'desc' },
    take: 10
  });

  if (history.length < 3) {
    return {
      confidence: 0,
      recommendedAction: 'Insufficient data for prediction'
    };
  }

  // Calculate average time between failures
  const intervals: number[] = [];
  for (let i = 1; i < history.length; i++) {
    const current = new Date(history[i - 1].scheduledDate).getTime();
    const previous = new Date(history[i].scheduledDate).getTime();
    intervals.push(current - previous);
  }

  const avgInterval = intervals.reduce((sum, i) => sum + i, 0) / intervals.length;
  const lastMaintenance = new Date(history[0].scheduledDate).getTime();
  const predictedFailure = new Date(lastMaintenance + avgInterval);

  const daysUntilFailure = (predictedFailure.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

  let recommendedAction = 'Continue normal operation';
  if (daysUntilFailure < 7) {
    recommendedAction = 'Schedule maintenance immediately';
  } else if (daysUntilFailure < 30) {
    recommendedAction = 'Plan maintenance within 2 weeks';
  }

  return {
    predictedFailureDate: predictedFailure,
    confidence: Math.min(0.9, 0.5 + (history.length * 0.05)),
    recommendedAction
  };
}

// ============================================================================
// HOUSEKEEPING OPTIMIZATION
// ============================================================================

/**
 * Optimize housekeeping route based on:
 * - Room locations
 * - Check-out times
 * - VIP status
 * - Early check-ins
 */
export async function optimizeHousekeepingRoute(
  floor?: number,
  section?: string
): Promise<HousekeepingTask[]> {
  try {
    // Get all rooms needing cleaning
    const rooms = await prisma.room.findMany({
      where: {
        ...(floor ? { floor } : {}),
        ...(section ? { section } : {}),
        status: {
          in: ['dirty', 'inspection']
        }
      },
      include: {
        reservations: {
          where: {
            checkOut: {
              gte: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        }
      }
    });

    // Create tasks with priorities
    const tasks: HousekeepingTask[] = [];

    for (const room of rooms) {
      // Determine priority
      let priority: HousekeepingTask['priority'] = 'medium';

      // Check for early check-in
      const earlyCheckIn = room.reservations.some(
        r => new Date(r.checkIn).getHours() < 14
      );
      if (earlyCheckIn) {
        priority = 'high';
      }

      // Check for VIP
      const vipGuest = room.reservations.some(r => r.guest?.loyalty?.tier === 'platinum' || r.guest?.loyalty?.tier === 'diamond');
      if (vipGuest) {
        priority = 'vip';
      }

      // Determine type
      const isCheckout = room.reservations.some(
        r => new Date(r.checkOut).toDateString() === new Date().toDateString()
      );
      const type: HousekeepingTask['type'] = isCheckout ? 'checkout' : 'stay-over';

      tasks.push({
        id: `housekeeping-${Date.now()}-${room.id}`,
        roomId: room.id,
        roomNumber: room.roomNumber,
        type,
        priority,
        status: 'pending',
        estimatedDuration: type === 'checkout' ? 45 : 30
      });
    }

    // Sort by priority and location
    const priorityOrder = { vip: 0, high: 1, medium: 2, low: 3 };
    tasks.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.roomNumber.localeCompare(b.roomNumber);
    });

    return tasks;
  } catch (error) {
    console.error('[Operational Efficiency] optimizeHousekeepingRoute error:', error);
    return [];
  }
}

/**
 * Assign housekeeping tasks to staff based on workload
 */
export async function assignHousekeepingTasks(
  tasks: HousekeepingTask[]
): Promise<HousekeepingTask[]> {
  // Get available housekeeping staff
  const staff = await prisma.employee.findMany({
    where: {
      department: 'housekeeping',
      status: 'active'
    },
    include: {
      tasks: {
        where: {
          status: { in: ['assigned', 'in-progress'] }
        }
      }
    }
  });

  // Calculate current workload for each staff
  const workload = staff.map(s => ({
    employee: s,
    currentLoad: s.tasks.reduce((sum, t) => sum + t.estimatedDuration, 0)
  }));

  // Sort by workload (least busy first)
  workload.sort((a, b) => a.currentLoad - b.currentLoad);

  // Assign tasks
  const assignedTasks: HousekeepingTask[] = [];
  let staffIndex = 0;

  for (const task of tasks) {
    const assignedStaff = workload[staffIndex % workload.length];
    
    assignedTasks.push({
      ...task,
      assignedTo: assignedStaff.employee.id,
      status: 'assigned'
    });

    assignedStaff.currentLoad += task.estimatedDuration;
    staffIndex++;
  }

  return assignedTasks;
}

// ============================================================================
// ENERGY MANAGEMENT
// ============================================================================

/**
 * Track energy consumption and identify anomalies
 */
export async function trackEnergyConsumption(
  type?: 'electricity' | 'water' | 'gas' | 'hvac',
  area?: string
): Promise<{
  currentReading: EnergyReading;
  averageConsumption: number;
  anomaly?: boolean;
  estimatedCost: number;
}> {
  try {
    // Get latest reading
    const latestReading = await prisma.energyReading.findFirst({
      where: {
        ...(type ? { type } : {}),
        ...(area ? { area } : {})
      },
      orderBy: {
        timestamp: 'desc'
      }
    });

    if (!latestReading) {
      return {
        currentReading: {} as EnergyReading,
        averageConsumption: 0,
        estimatedCost: 0
      };
    }

    // Get historical average
    const historicalAverage = await prisma.energyReading.aggregate({
      where: {
        ...(type ? { type } : {}),
        ...(area ? { area } : {}),
        timestamp: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      },
      _avg: {
        consumption: true
      }
    });

    const averageConsumption = historicalAverage._avg.consumption || 0;
    const anomaly = Math.abs(latestReading.consumption - averageConsumption) > (averageConsumption * 0.3); // 30% deviation

    return {
      currentReading: latestReading as EnergyReading,
      averageConsumption,
      anomaly,
      estimatedCost: latestReading.cost
    };
  } catch (error) {
    console.error('[Operational Efficiency] trackEnergyConsumption error:', error);
    return {
      currentReading: {} as EnergyReading,
      averageConsumption: 0,
      estimatedCost: 0
    };
  }
}

/**
 * Generate energy saving recommendations
 */
export async function generateEnergySavingRecommendations(
  area?: string
): Promise<Array<{
  recommendation: string;
  potentialSavings: number;
  implementationCost: string;
  paybackPeriod: string;
}>> {
  const recommendations = [];

  // Analyze HVAC usage
  const hvacData = await prisma.energyReading.findMany({
    where: {
      type: 'hvac',
      ...(area ? { area } : {}),
      timestamp: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      }
    }
  });

  if (hvacData.length > 0) {
    const avgConsumption = hvacData.reduce((sum, r) => sum + r.consumption, 0) / hvacData.length;
    
    recommendations.push({
      recommendation: 'Install smart thermostats with occupancy sensors',
      potentialSavings: Math.round(avgConsumption * 0.15 * 12), // 15% savings annually
      implementationCost: '€5,000 - €10,000',
      paybackPeriod: '12-18 months'
    });

    recommendations.push({
      recommendation: 'Implement night setback temperatures',
      potentialSavings: Math.round(avgConsumption * 0.10 * 12), // 10% savings
      implementationCost: '€0 - €1,000',
      paybackPeriod: '1-3 months'
    });
  }

  // Analyze lighting (if data available)
  const lightingData = await prisma.energyReading.findMany({
    where: {
      type: 'electricity',
      area: { contains: 'lighting' }
    }
  });

  if (lightingData.length > 0) {
    recommendations.push({
      recommendation: 'Upgrade to LED lighting throughout property',
      potentialSavings: Math.round(1000 * 12), // Estimated €1000/month
      implementationCost: '€15,000 - €30,000',
      paybackPeriod: '18-24 months'
    });

    recommendations.push({
      recommendation: 'Install motion sensors in low-traffic areas',
      potentialSavings: Math.round(300 * 12),
      implementationCost: '€2,000 - €5,000',
      paybackPeriod: '8-12 months'
    });
  }

  return recommendations;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  // Staff Scheduling
  optimizeStaffSchedule,
  calculateRequiredStaff,
  checkEmployeeAvailability,
  checkLaborCompliance,
  
  // Inventory Management
  checkInventoryLevels,
  generatePurchaseOrders,
  trackInventoryUsage,
  
  // Maintenance Planning
  generatePreventiveMaintenanceSchedule,
  calculateNextMaintenanceDue,
  predictMaintenanceNeeds,
  
  // Housekeeping Optimization
  optimizeHousekeepingRoute,
  assignHousekeepingTasks,
  
  // Energy Management
  trackEnergyConsumption,
  generateEnergySavingRecommendations
};

export type {
  StaffSchedule,
  InventoryItem,
  MaintenanceTask,
  HousekeepingTask,
  EnergyReading
};
