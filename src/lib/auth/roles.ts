/**
 * AgentFlow Pro - Role-Based Access Control
 * Defines user roles and permissions for hotel management system
 */

// User role types
export type UserRole = 'DIRECTOR' | 'RECEPTOR' | 'HOUSEKEEPING' | 'ADMIN' | 'MAINTENANCE' | 'MANAGER';

// Permission categories
export type PermissionCategory = 
  | 'dashboard'
  | 'reservations'
  | 'guests'
  | 'rooms'
  | 'housekeeping'
  | 'maintenance'
  | 'reports'
  | 'settings'
  | 'users'
  | 'properties'
  | 'pricing'
  | 'integrations';

// Permission actions
export type PermissionAction = 
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'checkin'
  | 'checkout'
  | 'assign'
  | 'manage';

// Permission format: category:action
export type Permission = `${PermissionCategory}:${PermissionAction}`;

// Role permissions mapping
export const rolePermissions: Record<UserRole, Permission[]> = {
  DIRECTOR: [
    // Dashboard access
    'dashboard:view',
    'dashboard:analytics',
    
    // Full reservation access
    'reservations:view',
    'reservations:create',
    'reservations:edit',
    'reservations:delete',
    'reservations:approve',
    'reservations:checkin',
    'reservations:checkout',
    
    // Full guest access
    'guests:view',
    'guests:create',
    'guests:edit',
    'guests:delete',
    'guests:search',
    
    // Full room access
    'rooms:view',
    'rooms:create',
    'rooms:edit',
    'rooms:delete',
    'rooms:manage',
    
    // Housekeeping oversight
    'housekeeping:view',
    'housekeeping:assign',
    'housekeeping:manage',
    
    // Maintenance oversight
    'maintenance:view',
    'maintenance:assign',
    'maintenance:manage',
    
    // Full reports access
    'reports:view',
    'reports:export',
    'reports:analytics',
    
    // Settings and management
    'settings:view',
    'settings:edit',
    'users:view',
    'users:create',
    'users:edit',
    'users:delete',
    'users:manage',
    'properties:view',
    'properties:create',
    'properties:edit',
    'properties:delete',
    'pricing:view',
    'pricing:edit',
    'integrations:view',
    'integrations:manage',
  ],
  
  RECEPTOR: [
    // Dashboard access
    'dashboard:view',
    
    // Reservation operations
    'reservations:view',
    'reservations:create',
    'reservations:edit',
    'reservations:checkin',
    'reservations:checkout',
    
    // Guest operations
    'guests:view',
    'guests:create',
    'guests:edit',
    'guests:search',
    
    // Room status
    'rooms:view',
    'rooms:manage',
    
    // Housekeeping requests
    'housekeeping:view',
    'housekeeping:assign',
    
    // Maintenance requests
    'maintenance:view',
    'maintenance:create',
    
    // Basic reports
    'reports:view',
    'reports:export',
    
    // Limited settings
    'settings:view',
  ],
  
  HOUSEKEEPING: [
    // Dashboard access
    'dashboard:view',
    
    // Room access
    'rooms:view',
    'rooms:manage',
    
    // Housekeeping operations
    'housekeeping:view',
    'housekeeping:assign',
    'housekeeping:manage',
    
    // Maintenance requests
    'maintenance:view',
    'maintenance:create',
    
    // Guest information (limited)
    'guests:view',
    
    // Basic reports
    'reports:view',
  ],
  
  MAINTENANCE: [
    // Dashboard access
    'dashboard:view',
    
    // Room access
    'rooms:view',
    'rooms:manage',
    
    // Maintenance operations
    'maintenance:view',
    'maintenance:assign',
    'maintenance:manage',
    
    // Housekeeping coordination
    'housekeeping:view',
    
    // Guest information (limited)
    'guests:view',
    
    // Basic reports
    'reports:view',
  ],
  
  MANAGER: [
    // Dashboard access
    'dashboard:view',
    'dashboard:analytics',
    
    // Reservation oversight
    'reservations:view',
    'reservations:edit',
    'reservations:approve',
    
    // Guest management
    'guests:view',
    'guests:edit',
    'guests:search',
    
    // Room management
    'rooms:view',
    'rooms:edit',
    'rooms:manage',
    
    // Staff management
    'housekeeping:view',
    'housekeeping:assign',
    'housekeeping:manage',
    'maintenance:view',
    'maintenance:assign',
    'maintenance:manage',
    
    // Reports and analytics
    'reports:view',
    'reports:export',
    'reports:analytics',
    
    // Pricing management
    'pricing:view',
    'pricing:edit',
    
    // Limited settings
    'settings:view',
    'settings:edit',
  ],
  
  ADMIN: [
    // Full system access
    '*',
  ],
};

// Role hierarchy (for role escalation)
export const roleHierarchy: Record<UserRole, UserRole[]> = {
  DIRECTOR: [],
  RECEPTOR: ['DIRECTOR'],
  HOUSEKEEPING: ['DIRECTOR', 'MANAGER'],
  MAINTENANCE: ['DIRECTOR', 'MANAGER'],
  MANAGER: ['DIRECTOR'],
  ADMIN: ['DIRECTOR'],
};

// Role display names
export const roleDisplayNames: Record<UserRole, string> = {
  DIRECTOR: 'Director',
  RECEPTOR: 'Receptor',
  HOUSEKEEPING: 'Housekeeping',
  ADMIN: 'Administrator',
  MAINTENANCE: 'Maintenance',
  MANAGER: 'Manager',
};

// Role descriptions
export const roleDescriptions: Record<UserRole, string> = {
  DIRECTOR: 'Full access to all hotel operations and management functions',
  RECEPTOR: 'Front desk operations, guest check-in/out, and reservation management',
  HOUSEKEEPING: 'Room cleaning, maintenance coordination, and housekeeping management',
  ADMIN: 'System administration and full technical access',
  MAINTENANCE: 'Facility maintenance, repairs, and equipment management',
  MANAGER: 'Operations management, staff oversight, and reporting',
};

// Permission checking functions
export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = rolePermissions[role];
  
  // Admin has all permissions
  if (permissions.includes('*')) {
    return true;
  }
  
  return permissions.includes(permission);
}

export function hasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some(permission => hasPermission(role, permission));
}

export function hasAllPermissions(role: UserRole, permissions: Permission[]): boolean {
  return permissions.every(permission => hasPermission(role, permission));
}

// Role escalation check
export function canAccessRole(userRole: UserRole, targetRole: UserRole): boolean {
  if (userRole === targetRole) return true;
  
  const higherRoles = roleHierarchy[userRole] || [];
  return higherRoles.includes(targetRole);
}

// Get all permissions for a role
export function getRolePermissions(role: UserRole): Permission[] {
  return rolePermissions[role];
}

// Check if role can perform action on resource
export function canPerformAction(role: UserRole, category: PermissionCategory, action: PermissionAction): boolean {
  const permission = `${category}:${action}` as Permission;
  return hasPermission(role, permission);
}

// Utility functions for common permission checks
export const permissions = {
  // Dashboard permissions
  canViewDashboard: (role: UserRole) => hasPermission(role, 'dashboard:view'),
  canViewAnalytics: (role: UserRole) => hasPermission(role, 'dashboard:analytics'),
  
  // Reservation permissions
  canViewReservations: (role: UserRole) => hasPermission(role, 'reservations:view'),
  canCreateReservations: (role: UserRole) => hasPermission(role, 'reservations:create'),
  canEditReservations: (role: UserRole) => hasPermission(role, 'reservations:edit'),
  canDeleteReservations: (role: UserRole) => hasPermission(role, 'reservations:delete'),
  canApproveReservations: (role: UserRole) => hasPermission(role, 'reservations:approve'),
  canCheckInGuests: (role: UserRole) => hasPermission(role, 'reservations:checkin'),
  canCheckOutGuests: (role: UserRole) => hasPermission(role, 'reservations:checkout'),
  
  // Guest permissions
  canViewGuests: (role: UserRole) => hasPermission(role, 'guests:view'),
  canCreateGuests: (role: UserRole) => hasPermission(role, 'guests:create'),
  canEditGuests: (role: UserRole) => hasPermission(role, 'guests:edit'),
  canDeleteGuests: (role: UserRole) => hasPermission(role, 'guests:delete'),
  canSearchGuests: (role: UserRole) => hasPermission(role, 'guests:search'),
  
  // Room permissions
  canViewRooms: (role: UserRole) => hasPermission(role, 'rooms:view'),
  canCreateRooms: (role: UserRole) => hasPermission(role, 'rooms:create'),
  canEditRooms: (role: UserRole) => hasPermission(role, 'rooms:edit'),
  canDeleteRooms: (role: UserRole) => hasPermission(role, 'rooms:delete'),
  canManageRooms: (role: UserRole) => hasPermission(role, 'rooms:manage'),
  
  // Housekeeping permissions
  canViewHousekeeping: (role: UserRole) => hasPermission(role, 'housekeeping:view'),
  canAssignHousekeeping: (role: UserRole) => hasPermission(role, 'housekeeping:assign'),
  canManageHousekeeping: (role: UserRole) => hasPermission(role, 'housekeeping:manage'),
  
  // Maintenance permissions
  canViewMaintenance: (role: UserRole) => hasPermission(role, 'maintenance:view'),
  canCreateMaintenance: (role: UserRole) => hasPermission(role, 'maintenance:create'),
  canAssignMaintenance: (role: UserRole) => hasPermission(role, 'maintenance:assign'),
  canManageMaintenance: (role: UserRole) => hasPermission(role, 'maintenance:manage'),
  
  // Reports permissions
  canViewReports: (role: UserRole) => hasPermission(role, 'reports:view'),
  canExportReports: (role: UserRole) => hasPermission(role, 'reports:export'),
  canViewAnalytics: (role: UserRole) => hasPermission(role, 'reports:analytics'),
  
  // Settings permissions
  canViewSettings: (role: UserRole) => hasPermission(role, 'settings:view'),
  canEditSettings: (role: UserRole) => hasPermission(role, 'settings:edit'),
  
  // User management permissions
  canViewUsers: (role: UserRole) => hasPermission(role, 'users:view'),
  canCreateUsers: (role: UserRole) => hasPermission(role, 'users:create'),
  canEditUsers: (role: UserRole) => hasPermission(role, 'users:edit'),
  canDeleteUsers: (role: UserRole) => hasPermission(role, 'users:delete'),
  canManageUsers: (role: UserRole) => hasPermission(role, 'users:manage'),
  
  // Property permissions
  canViewProperties: (role: UserRole) => hasPermission(role, 'properties:view'),
  canCreateProperties: (role: UserRole) => hasPermission(role, 'properties:create'),
  canEditProperties: (role: UserRole) => hasPermission(role, 'properties:edit'),
  canDeleteProperties: (role: UserRole) => hasPermission(role, 'properties:delete'),
  
  // Pricing permissions
  canViewPricing: (role: UserRole) => hasPermission(role, 'pricing:view'),
  canEditPricing: (role: UserRole) => hasPermission(role, 'pricing:edit'),
  
  // Integration permissions
  canViewIntegrations: (role: UserRole) => hasPermission(role, 'integrations:view'),
  canManageIntegrations: (role: UserRole) => hasPermission(role, 'integrations:manage'),
};

// Middleware helper for API routes
export function requirePermission(permission: Permission) {
  return (userRole: UserRole): boolean => {
    return hasPermission(userRole, permission);
  };
}

// Role validation utility
export function isValidRole(role: string): role is UserRole {
  return Object.values(roleDisplayNames).includes(role as UserRole);
}

// Default role for new users
export const DEFAULT_ROLE: UserRole = 'RECEPTOR';

// Export all types and utilities
export type {
  Permission,
  PermissionCategory,
  PermissionAction,
};
