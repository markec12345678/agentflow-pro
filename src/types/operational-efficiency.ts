/**
 * Operational Efficiency Types and Interfaces
 */

export interface StaffSchedule {
  id: string;
  staffId: string;
  propertyId: string;
  department: StaffDepartment;
  position: StaffPosition;
  shiftType: ShiftType;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  breakDuration: number; // in minutes
  overtimeHours: number;
  status: ScheduleStatus;
  priority: SchedulePriority;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
}

export type StaffDepartment = 
  | 'front-desk'
  | 'housekeeping'
  | 'maintenance'
  | 'food-beverage'
  | 'spa'
  | 'security'
  | 'management'
  | 'administration';

export type StaffPosition = 
  | 'manager'
  | 'supervisor'
  | 'team-lead'
  | 'senior-staff'
  | 'staff'
  | 'trainee';

export type ShiftType = 
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'night'
  | 'split'
  | 'on-call'
  | 'flexible';

export type ScheduleStatus = 
  | 'draft'
  | 'pending'
  | 'approved'
  | 'published'
  | 'active'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type SchedulePriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export interface StaffMember {
  id: string;
  personalInfo: StaffPersonalInfo;
  employment: StaffEmploymentInfo;
  skills: StaffSkill[];
  certifications: StaffCertification[];
  availability: StaffAvailability;
  performance: StaffPerformance;
  preferences: StaffPreferences;
  schedule: StaffSchedule[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StaffPersonalInfo {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: Date;
  address: StaffAddress;
  emergencyContact: StaffEmergencyContact;
  photo?: string;
  gender: 'male' | 'female' | 'other';
  nationality: string;
  languages: string[];
}

export interface StaffEmploymentInfo {
  employeeId: string;
  department: StaffDepartment;
  position: StaffPosition;
  hireDate: Date;
  employmentType: 'full-time' | 'part-time' | 'contract' | 'seasonal';
  workSchedule: 'fixed' | 'rotating' | 'flexible';
  salary: StaffSalary;
  benefits: StaffBenefit[];
  status: 'active' | 'inactive' | 'on-leave' | 'terminated';
  reportsTo?: string;
  teamMembers?: string[];
}

export interface StaffSalary {
  type: 'hourly' | 'salary' | 'commission' | 'hybrid';
  amount: number;
  currency: string;
  payFrequency: 'weekly' | 'bi-weekly' | 'monthly';
  overtimeRate: number;
  bonusEligible: boolean;
  commissionRate?: number;
}

export interface StaffBenefit {
  id: string;
  name: string;
  type: 'health' | 'dental' | 'vision' | 'retirement' | 'paid-time-off' | 'other';
  description: string;
  value: number;
  unit: 'percentage' | 'currency' | 'days' | 'hours';
  effectiveDate: Date;
  expiryDate?: Date;
}

export interface StaffAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface StaffEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email: string;
  address?: string;
}

export interface StaffSkill {
  id: string;
  name: string;
  category: SkillCategory;
  level: SkillLevel;
  acquiredDate: Date;
  expiryDate?: Date;
  certified: boolean;
  lastUsed: Date;
  usageFrequency: number;
}

export type SkillCategory = 
  | 'technical'
  | 'customer-service'
  | 'language'
  | 'management'
  | 'safety'
  | 'compliance'
  | 'software'
  | 'equipment';

export type SkillLevel = 
  | 'beginner'
  | 'intermediate'
  | 'advanced'
  | 'expert'
  | 'master';

export interface StaffCertification {
  id: string;
  name: string;
  issuingOrganization: string;
  issueDate: Date;
  expiryDate?: Date;
  certificateNumber: string;
  verificationUrl?: string;
  status: 'active' | 'expired' | 'pending-renewal';
  category: SkillCategory;
}

export interface StaffAvailability {
  weekly: WeeklyAvailability[];
  exceptions: AvailabilityException[];
  maxHoursPerWeek: number;
  maxHoursPerDay: number;
  minHoursPerWeek: number;
  preferredShifts: ShiftType[];
  unavailableDates: Date[];
}

export interface WeeklyAvailability {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  available: boolean;
  timeSlots: TimeSlot[];
}

export interface TimeSlot {
  start: string; // HH:mm format
  end: string; // HH:mm format
  type: 'available' | 'preferred' | 'unavailable';
}

export interface AvailabilityException {
  id: string;
  startDate: Date;
  endDate: Date;
  type: 'unavailable' | 'preferred' | 'limited';
  reason: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface StaffPerformance {
  metrics: PerformanceMetric[];
  reviews: PerformanceReview[];
  attendance: AttendanceRecord[];
  productivity: ProductivityMetric[];
  goals: PerformanceGoal[];
  overallRating: number;
  lastReviewDate: Date;
  nextReviewDate: Date;
}

export interface PerformanceMetric {
  id: string;
  name: string;
  category: PerformanceCategory;
  value: number;
  target: number;
  unit: string;
  period: string;
  trend: 'improving' | 'stable' | 'declining';
  lastUpdated: Date;
}

export type PerformanceCategory = 
  | 'quality'
  | 'productivity'
  | 'customer-satisfaction'
  | 'teamwork'
  | 'attendance'
  | 'safety'
  | 'compliance'
  | 'sales'
  | 'cost-efficiency';

export interface PerformanceReview {
  id: string;
  reviewerId: string;
  reviewDate: Date;
  period: ReviewPeriod;
  overallRating: number;
  categories: CategoryRating[];
  strengths: string[];
  areasForImprovement: string[];
  goals: string[];
  comments: string;
  status: 'draft' | 'submitted' | 'reviewed' | 'approved';
  reviewedBy?: string;
  reviewedAt?: Date;
}

export interface ReviewPeriod {
  startDate: Date;
  endDate: Date;
  type: 'weekly' | 'monthly' | 'quarterly' | 'annual';
}

export interface CategoryRating {
  category: PerformanceCategory;
  rating: number;
  comments: string;
}

export interface AttendanceRecord {
  id: string;
  date: Date;
  scheduledStart: Date;
  scheduledEnd: Date;
  actualStart?: Date;
  actualEnd?: Date;
  breakDuration: number;
  overtimeHours: number;
  status: AttendanceStatus;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
}

export type AttendanceStatus = 
  | 'present'
  | 'absent'
  | 'late'
  | 'early-departure'
  | 'no-show'
  | 'approved-absence'
  | 'unapproved-absence';

export interface ProductivityMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  period: string;
  benchmark: number;
  efficiency: number;
  lastUpdated: Date;
}

export interface PerformanceGoal {
  id: string;
  title: string;
  description: string;
  category: PerformanceCategory;
  target: number;
  current: number;
  unit: string;
  dueDate: Date;
  status: 'not-started' | 'in-progress' | 'completed' | 'overdue';
  priority: 'low' | 'medium' | 'high';
  assignedBy: string;
  assignedAt: Date;
  completedAt?: Date;
}

export interface StaffPreferences {
  preferredShifts: ShiftType[];
  preferredDays: number[];
  workLocationPreference: 'on-site' | 'remote' | 'hybrid';
  teamPreferences: string[];
  taskPreferences: string[];
  communicationStyle: 'formal' | 'casual' | 'direct' | 'supportive';
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  careerGoals: string[];
  workLifeBalance: number; // 1-10 scale
  stressLevel: number; // 1-10 scale
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  category: InventoryCategory;
  sku: string;
  barcode?: string;
  supplier: Supplier;
  unit: string;
  currentStock: number;
  minimumStock: number;
  maximumStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  unitCost: number;
  sellingPrice?: number;
  location: InventoryLocation;
  status: InventoryStatus;
  lastUpdated: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, unknown>;
}

export type InventoryCategory = 
  | 'housekeeping'
  | 'food-beverage'
  | 'maintenance'
  | 'office'
  | 'linens'
  | 'amenities'
  | 'furniture'
  | 'electronics'
  | 'safety'
  | 'cleaning'
  | 'guest-supplies'
  | 'uniforms';

export type InventoryStatus = 
  | 'in-stock'
  | 'low-stock'
  | 'out-of-stock'
  | 'discontinued'
  | 'on-order'
  | 'damaged'
  | 'expired';

export interface Supplier {
  id: string;
  name: string;
  contactInfo: SupplierContactInfo;
  address: SupplierAddress;
  paymentTerms: PaymentTerms;
  leadTime: number; // in days
  qualityRating: number;
  reliabilityRating: number;
  costRating: number;
  overallRating: number;
  categories: InventoryCategory[];
  status: 'active' | 'inactive' | 'under-review';
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplierContactInfo {
  primaryContact: string;
  email: string;
  phone: string;
  website?: string;
  fax?: string;
  alternativeContacts?: AlternativeContact[];
}

export interface AlternativeContact {
  name: string;
  role: string;
  email: string;
  phone: string;
}

export interface SupplierAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface PaymentTerms {
  type: 'net-15' | 'net-30' | 'net-60' | 'cod' | 'custom';
  days: number;
  discountPercent?: number;
  discountDays?: number;
  currency: string;
}

export interface InventoryLocation {
  id: string;
  name: string;
  type: LocationType;
  propertyId: string;
  area: string;
  capacity: number;
  currentUtilization: number;
  temperature?: number;
  humidity?: number;
  accessLevel: 'public' | 'staff' | 'restricted';
  lastUpdated: Date;
}

export type LocationType = 
  | 'storage-room'
  | 'pantry'
  | 'warehouse'
  | 'refrigerated'
  | 'freezer'
  | 'shelf'
  | 'cabinet'
  'vehicle'
  | 'mobile-unit';

export interface InventoryTransaction {
  id: string;
  itemId: string;
  type: TransactionType;
  quantity: number;
  unitCost: number;
  totalCost: number;
  reference: string;
  reason: string;
  performedBy: string;
  performedAt: Date;
  locationId: string;
  approvedBy?: string;
  approvedAt?: Date;
  metadata: Record<string, unknown>;
}

export type TransactionType = 
  | 'purchase'
  | 'sale'
  | 'transfer'
  | 'adjustment'
  | 'return'
  | 'damage'
  | 'expiration'
  | 'theft'
  | 'donation'
  | 'consumption';

export interface MaintenanceRequest {
  id: string;
  title: string;
  description: string;
  category: MaintenanceCategory;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  location: MaintenanceLocation;
  requestedBy: string;
  requestedAt: Date;
  assignedTo?: string;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration?: number; // in hours
  actualDuration?: number; // in hours
  cost: MaintenanceCost;
  parts: MaintenancePart[];
  notes: MaintenanceNote[];
  images: string[];
  satisfactionRating?: number;
  feedback?: string;
  recurring: boolean;
  recurringSchedule?: RecurringSchedule;
  preventive: boolean;
  nextScheduledDate?: Date;
}

export type MaintenanceCategory = 
  | 'hvac'
  | 'plumbing'
  | 'electrical'
  | 'carpentry'
  | 'painting'
  | 'appliance'
  | 'elevator'
  | 'pool'
  | 'landscaping'
  | 'pest-control'
  | 'security'
  | 'fire-safety'
  | 'cleaning'
  | 'other';

export type MaintenancePriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'emergency'
  | 'critical';

export type MaintenanceStatus = 
  | 'requested'
  | 'approved'
  | 'assigned'
  | 'in-progress'
  | 'on-hold'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface MaintenanceLocation {
  type: 'room' | 'area' | 'equipment' | 'facility';
  identifier: string; // room number, area name, equipment ID
  description: string;
  propertyId: string;
  floor?: number;
  building?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface MaintenanceCost {
  labor: number;
  parts: number;
  materials: number;
  equipment: number;
  other: number;
  total: number;
  currency: string;
  approved: boolean;
  approvedBy?: string;
  approvedAt?: Date;
}

export interface MaintenancePart {
  id: string;
  name: string;
  partNumber: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  supplier: string;
  orderedAt?: Date;
  receivedAt?: Date;
  warranty?: string;
}

export interface MaintenanceNote {
  id: string;
  content: string;
  author: string;
  createdAt: Date;
  type: 'internal' | 'external' | 'customer';
  attachments?: string[];
}

export interface RecurringSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually';
  interval: number;
  dayOfWeek?: number;
  dayOfMonth?: number;
  monthOfYear?: number;
  startDate: Date;
  endDate?: Date;
  nextExecution: Date;
}

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  taskType: HousekeepingTaskType;
  priority: TaskPriority;
  status: TaskStatus;
  assignedTo?: string;
  assignedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  estimatedDuration: number; // in minutes
  actualDuration?: number; // in minutes
  standardProcedure: string;
  checklist: TaskChecklist[];
  notes: string;
  qualityScore?: number;
  inspectedBy?: string;
  inspectedAt?: Date;
  guestFeedback?: string;
  supplies: SupplyUsage[];
  createdAt: Date;
  updatedAt: Date;
}

export type HousekeepingTaskType = 
  | 'room-cleaning'
  | 'deep-cleaning'
  | 'turnover'
  | 'turndown'
  | 'laundry'
  | 'public-areas'
  | 'linen-change'
  | 'amenity-restock'
  | 'maintenance-check'
  | 'special-request';

export type TaskPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'urgent';

export type TaskStatus = 
  | 'pending'
  | 'assigned'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'on-hold'
  | 'overdue';

export interface TaskChecklist {
  id: string;
  item: string;
  completed: boolean;
  completedAt?: Date;
  completedBy?: string;
  notes?: string;
  required: boolean;
}

export interface SupplyUsage {
  supplyId: string;
  supplyName: string;
  quantity: number;
  unit: string;
  unitCost: number;
  totalCost: number;
}

export interface EnergyConsumption {
  id: string;
  propertyId: string;
  meterId: string;
  meterType: EnergyType;
  reading: number;
  unit: string;
  timestamp: Date;
  cost: number;
  currency: string;
  source: EnergySource;
  location: EnergyLocation;
  metadata: Record<string, unknown>;
}

export type EnergyType = 
  | 'electricity'
  | 'gas'
  | 'water'
  | 'solar'
  | 'steam'
  | 'thermal';

export type EnergySource = 
  | 'grid'
  | 'solar'
  | 'generator'
  | 'wind'
  | 'battery'
  | 'other';

export interface EnergyLocation {
  type: 'property' | 'building' | 'floor' | 'room' | 'equipment';
  identifier: string;
  description: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface EnergyOptimization {
  id: string;
  propertyId: string;
  type: OptimizationType;
  description: string;
  currentConsumption: number;
  targetConsumption: number;
  potentialSavings: number;
  implementationCost: number;
  paybackPeriod: number; // in months
  priority: OptimizationPriority;
  status: OptimizationStatus;
  recommendedBy: string;
  recommendedAt: Date;
  approvedBy?: string;
  approvedAt?: Date;
  implementedAt?: Date;
  results?: OptimizationResult;
}

export type OptimizationType = 
  | 'lighting'
  | 'hvac'
  | 'insulation'
  | 'equipment-upgrade'
  | 'behavioral'
  | 'scheduling'
  | 'automation'
  | 'renewable-energy'
  | 'water-conservation'
  | 'waste-reduction';

export type OptimizationPriority = 
  | 'low'
  | 'medium'
  | 'high'
  | 'critical';

export type OptimizationStatus = 
  | 'recommended'
  | 'approved'
  | 'planned'
  | 'in-progress'
  | 'completed'
  | 'cancelled'
  | 'rejected';

export interface OptimizationResult {
  actualSavings: number;
  actualPaybackPeriod: number;
  efficiency: number;
  satisfaction: number;
  measuredAt: Date;
  notes: string;
}

export interface OperationalEfficiencyEngine {
  // Staff Management
  getStaffSchedule: (propertyId: string, date: Date) => Promise<StaffSchedule[]>;
  optimizeStaffSchedule: (propertyId: string, date: Date) => Promise<StaffSchedule[]>;
  updateStaffSchedule: (scheduleId: string, updates: Partial<StaffSchedule>) => Promise<StaffSchedule>;
  getStaffPerformance: (staffId: string, period: DateRange) => Promise<StaffPerformance>;
  analyzeStaffEfficiency: (propertyId: string, period: DateRange) => Promise<StaffEfficiencyAnalysis>;
  
  // Inventory Management
  getInventoryLevels: (propertyId: string, category?: InventoryCategory) => Promise<InventoryItem[]>;
  optimizeInventory: (propertyId: string, category?: InventoryCategory) => Promise<InventoryOptimization>;
  updateInventory: (itemId: string, quantity: number, reason: string) => Promise<InventoryTransaction>;
  generatePurchaseOrders: (propertyId: string) => Promise<PurchaseOrder[]>;
  
  // Maintenance Management
  getMaintenanceRequests: (propertyId: string, status?: MaintenanceStatus) => Promise<MaintenanceRequest[]>;
  optimizeMaintenanceSchedule: (propertyId: string) => Promise<MaintenanceSchedule>;
  predictMaintenanceNeeds: (propertyId: string, period: DateRange) => Promise<MaintenancePrediction[]>;
  updateMaintenanceRequest: (requestId: string, updates: Partial<MaintenanceRequest>) => Promise<MaintenanceRequest>;
  
  // Housekeeping Management
  getHousekeepingTasks: (propertyId: string, date: Date) => Promise<HousekeepingTask[]>;
  optimizeHousekeepingRoutes: (propertyId: string, date: Date) => Promise<HousekeepingRoute[]>;
  updateHousekeepingTask: (taskId: string, updates: Partial<HousekeepingTask>) => Promise<HousekeepingTask>;
  analyzeHousekeepingEfficiency: (propertyId: string, period: DateRange) => Promise<HousekeepingEfficiency>;
  
  // Energy Management
  getEnergyConsumption: (propertyId: string, period: DateRange) => Promise<EnergyConsumption[]>;
  optimizeEnergyUsage: (propertyId: string) => Promise<EnergyOptimization[]>;
  predictEnergyNeeds: (propertyId: string, period: DateRange) => Promise<EnergyPrediction>;
  trackEnergySavings: (propertyId: string, optimizationId: string) => Promise<EnergySavings>;
  
  // Analytics and Insights
  getOperationalMetrics: (propertyId: string, period: DateRange) => Promise<OperationalMetrics>;
  generateEfficiencyReport: (propertyId: string, period: DateRange) => Promise<EfficiencyReport>;
  identifyOptimizationOpportunities: (propertyId: string) => Promise<OptimizationOpportunity[]>;
  benchmarkPerformance: (propertyId: string, industry: string) => Promise<BenchmarkReport>;
}

export interface DateRange {
  start: Date;
  end: Date;
}

export interface StaffEfficiencyAnalysis {
  overallEfficiency: number;
  departmentEfficiency: Record<StaffDepartment, number>;
  productivityMetrics: ProductivityMetric[];
  costAnalysis: StaffCostAnalysis;
  recommendations: StaffRecommendation[];
  trends: EfficiencyTrend[];
  lastAnalyzed: Date;
}

export interface StaffCostAnalysis {
  totalCost: number;
  costPerRoom: number;
  costPerGuest: number;
  overtimeCost: number;
  trainingCost: number;
  turnoverCost: number;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  category: string;
  amount: number;
  percentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

export interface StaffRecommendation {
  id: string;
  type: StaffRecommendationType;
  description: string;
  impact: ImpactAssessment;
  implementation: ImplementationPlan;
  priority: 'low' | 'medium' | 'high';
  estimatedSavings: number;
  paybackPeriod: number;
  createdAt: Date;
}

export type StaffRecommendationType = 
  | 'scheduling'
  | 'training'
  | 'cross-training'
  | 'automation'
  | 'process-improvement'
  | 'resource-allocation'
  | 'performance-management';

export interface ImpactAssessment {
  efficiencyGain: number;
  costReduction: number;
  qualityImprovement: number;
  employeeSatisfaction: number;
  guestSatisfaction: number;
  risks: string[];
}

export interface ImplementationPlan {
  steps: ImplementationStep[];
  timeline: number; // in days
  resources: Resource[];
  dependencies: string[];
  successCriteria: string[];
}

export interface ImplementationStep {
  id: string;
  description: string;
  duration: number; // in days
  responsible: string;
  dependencies: string[];
  deliverables: string[];
}

export interface Resource {
  type: 'staff' | 'equipment' | 'software' | 'training' | 'budget';
  quantity: number;
  description: string;
  cost: number;
}

export interface EfficiencyTrend {
  metric: string;
  period: string;
  value: number;
  change: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface InventoryOptimization {
  currentLevels: InventoryLevel[];
  recommendations: InventoryRecommendation[];
  costSavings: number;
  wasteReduction: number;
  serviceLevel: number;
  lastOptimized: Date;
}

export interface InventoryLevel {
  itemId: string;
  itemName: string;
  currentStock: number;
  optimalStock: number;
  variance: number;
  daysOfSupply: number;
  turnoverRate: number;
  carryingCost: number;
}

export interface InventoryRecommendation {
  type: InventoryRecommendationType;
  itemId: string;
  itemName: string;
  action: string;
  quantity: number;
  estimatedSavings: number;
  implementationDate: Date;
  priority: 'low' | 'medium' | 'high';
}

export type InventoryRecommendationType = 
  | 'reorder'
  | 'reduce-stock'
  | 'change-supplier'
  | 'adjust-reorder-point'
  | 'consolidate'
  | 'discontinue';

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseOrderItem[];
  totalAmount: number;
  currency: string;
  orderDate: Date;
  expectedDeliveryDate: Date;
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'delivered' | 'cancelled';
  createdBy: string;
  approvedBy?: string;
  approvedAt?: Date;
  notes: string;
}

export interface PurchaseOrderItem {
  itemId: string;
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  expectedDeliveryDate: Date;
}

export interface MaintenanceSchedule {
  requests: ScheduledMaintenance[];
  optimization: ScheduleOptimization;
  efficiency: ScheduleEfficiency;
  lastGenerated: Date;
}

export interface ScheduledMaintenance {
  request: MaintenanceRequest;
  scheduledStart: Date;
  scheduledEnd: Date;
  assignedStaff: string[];
  requiredParts: string[];
  estimatedCost: number;
  priority: number;
}

export interface ScheduleOptimization {
  totalRequests: number;
  optimizedRequests: number;
  efficiencyGain: number;
  costSavings: number;
  timeSavings: number;
  algorithm: string;
}

export interface ScheduleEfficiency {
  utilizationRate: number;
  idleTime: number;
  overtimeReduction: number;
  responseTime: number;
  completionRate: number;
}

export interface MaintenancePrediction {
  equipmentId: string;
  equipmentName: string;
  failureProbability: number;
  predictedFailureDate: Date;
  recommendedAction: string;
  estimatedCost: number;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
}

export interface HousekeepingRoute {
  id: string;
  staffId: string;
  staffName: string;
  tasks: HousekeepingTask[];
  route: RoutePoint[];
  estimatedDuration: number;
  estimatedDistance: number;
  efficiency: number;
  createdAt: Date;
}

export interface RoutePoint {
  location: string;
  order: number;
  estimatedArrival: Date;
  estimatedDeparture: Date;
  taskIds: string[];
}

export interface HousekeepingEfficiency {
  overallEfficiency: number;
  roomTurnoverTime: number;
  cleaningQualityScore: number;
  supplyUsageEfficiency: number;
  staffProductivity: number;
  guestSatisfaction: number;
  recommendations: HousekeepingRecommendation[];
  trends: HousekeepingTrend[];
}

export interface HousekeepingRecommendation {
  type: HousekeepingRecommendationType;
  description: string;
  impact: string;
  implementation: string;
  estimatedSavings: number;
  priority: 'low' | 'medium' | 'high';
}

export type HousekeepingRecommendationType = 
  | 'route-optimization'
  | 'supply-management'
  | 'training'
  | 'equipment-upgrade'
  | 'process-improvement'
  | 'staffing-adjustment';

export interface HousekeepingTrend {
  metric: string;
  period: string;
  value: number;
  change: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface EnergyPrediction {
  type: EnergyType;
  predictedConsumption: number;
  predictedCost: number;
  period: DateRange;
  confidence: number;
  factors: PredictionFactor[];
  recommendations: EnergyRecommendation[];
}

export interface PredictionFactor {
  factor: string;
  impact: number;
  weight: number;
  description: string;
}

export interface EnergyRecommendation {
  type: EnergyRecommendationType;
  description: string;
  potentialSavings: number;
  implementationCost: number;
  paybackPeriod: number;
  priority: 'low' | 'medium' | 'high';
}

export type EnergyRecommendationType = 
  | 'schedule-adjustment'
  | 'temperature-optimization'
  | 'equipment-upgrade'
  | 'behavioral-change'
  | 'renewable-energy'
  | 'insulation'
  | 'automation';

export interface EnergySavings {
  optimizationId: string;
  period: DateRange;
  actualSavings: number;
  projectedSavings: number;
  efficiency: number;
  currency: string;
  measuredAt: Date;
}

export interface OperationalMetrics {
  overallEfficiency: number;
  costMetrics: CostMetrics;
  productivityMetrics: ProductivityMetrics;
  qualityMetrics: QualityMetrics;
  sustainabilityMetrics: SustainabilityMetrics;
  benchmarks: BenchmarkMetrics[];
  trends: MetricTrend[];
  lastUpdated: Date;
}

export interface CostMetrics {
  totalOperatingCost: number;
  costPerAvailableRoom: number;
  costPerOccupiedRoom: number;
  laborCostPercentage: number;
  utilityCostPercentage: number;
  maintenanceCostPercentage: number;
  supplyCostPercentage: number;
}

export interface ProductivityMetrics {
  roomsPerStaffHour: number;
  tasksPerStaffHour: number;
  overallProductivity: number;
  laborEfficiency: number;
  equipmentUtilization: number;
  spaceUtilization: number;
}

export interface QualityMetrics {
  guestSatisfactionScore: number;
  serviceQualityScore: number;
  cleanlinessScore: number;
  maintenanceResponseTime: number;
  firstCallResolution: number;
  errorRate: number;
}

export interface SustainabilityMetrics {
  energyConsumption: number;
  waterConsumption: number;
  wasteGeneration: number;
  recyclingRate: number;
  carbonFootprint: number;
  sustainabilityScore: number;
}

export interface BenchmarkMetrics {
  metric: string;
  currentValue: number;
  industryAverage: number;
  bestInClass: number;
  percentile: number;
  trend: 'above' | 'at' | 'below';
}

export interface MetricTrend {
  metric: string;
  period: string;
  value: number;
  change: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface EfficiencyReport {
  id: string;
  propertyId: string;
  period: DateRange;
  summary: ReportSummary;
  sections: ReportSection[];
  recommendations: ReportRecommendation[];
  charts: ReportChart[];
  generatedAt: Date;
  generatedBy: string;
}

export interface ReportSummary {
  overallEfficiency: number;
  keyFindings: string[];
  majorRecommendations: string[];
  potentialSavings: number;
  implementationPriority: string[];
}

export interface ReportSection {
  title: string;
  content: string;
  metrics: ReportMetric[];
  charts: string[];
}

export interface ReportMetric {
  name: string;
  value: number;
  unit: string;
  benchmark?: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface ReportRecommendation {
  title: string;
  description: string;
  impact: string;
  implementation: string;
  priority: 'low' | 'medium' | 'high';
  estimatedSavings: number;
  timeline: string;
}

export interface ReportChart {
  id: string;
  title: string;
  type: 'line' | 'bar' | 'pie' | 'scatter';
  data: ChartData[];
  xAxis: string;
  yAxis: string;
}

export interface ChartData {
  label: string;
  value: number;
  category?: string;
}

export interface OptimizationOpportunity {
  id: string;
  type: OpportunityType;
  title: string;
  description: string;
  potentialSavings: number;
  implementationCost: number;
  paybackPeriod: number;
  priority: 'low' | 'medium' | 'high';
  difficulty: 'easy' | 'moderate' | 'difficult';
  impact: ImpactLevel;
  timeline: string;
  dependencies: string[];
}

export type OpportunityType = 
  | 'staff-optimization'
  | 'inventory-management'
  | 'maintenance-efficiency'
  | 'energy-conservation'
  | 'process-automation'
  | 'space-utilization'
  | 'supply-chain'
  | 'technology-upgrade';

export type ImpactLevel = 
  | 'low'
  | 'medium'
  | 'high'
  | 'transformative';

export interface BenchmarkReport {
  propertyId: string;
  industry: string;
  benchmarks: BenchmarkComparison[];
  overallRanking: number;
  totalProperties: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  generatedAt: Date;
}

export interface BenchmarkComparison {
  metric: string;
  yourValue: number;
  industryAverage: number;
  topQuartile: number;
  bottomQuartile: number;
  percentile: number;
  gap: number;
  improvementPotential: number;
}
