/**
 * Unit tests for Role-Based Access Control
 * Tests role permissions, middleware, and access control logic
 */

import { hasPermission, hasAnyPermission, hasAllPermissions, canPerformAction, permissions, UserRole } from '@/lib/auth/roles';

describe('Role-Based Access Control Tests', () => {
  describe('Permission checking functions', () => {
    describe('hasPermission', () => {
      it('should grant access to admin for all permissions', () => {
        expect(hasPermission('ADMIN', 'dashboard:view')).toBe(true);
        expect(hasPermission('ADMIN', 'users:delete')).toBe(true);
        expect(hasPermission('ADMIN', 'integrations:manage')).toBe(true);
      });

      it('should grant access to director for director permissions', () => {
        expect(hasPermission('DIRECTOR', 'dashboard:view')).toBe(true);
        expect(hasPermission('DIRECTOR', 'reservations:approve')).toBe(true);
        expect(hasPermission('DIRECTOR', 'users:manage')).toBe(true);
      });

      it('should deny access to director for non-existent permissions', () => {
        expect(hasPermission('DIRECTOR', 'nonexistent:permission')).toBe(false);
      });

      it('should grant access to receptor for receptor permissions', () => {
        expect(hasPermission('RECEPTOR', 'dashboard:view')).toBe(true);
        expect(hasPermission('RECEPTOR', 'reservations:create')).toBe(true);
        expect(hasPermission('RECEPTOR', 'checkin:guest')).toBe(true);
      });

      it('should deny access to receptor for restricted permissions', () => {
        expect(hasPermission('RECEPTOR', 'users:manage')).toBe(false);
        expect(hasPermission('RECEPTOR', 'pricing:edit')).toBe(false);
        expect(hasPermission('RECEPTOR', 'integrations:manage')).toBe(false);
      });

      it('should grant access to housekeeping for housekeeping permissions', () => {
        expect(hasPermission('HOUSEKEEPING', 'dashboard:view')).toBe(true);
        expect(hasPermission('HOUSEKEEPING', 'rooms:manage')).toBe(true);
        expect(hasPermission('HOUSEKEEPING', 'housekeeping:manage')).toBe(true);
      });

      it('should deny access to housekeeping for restricted permissions', () => {
        expect(hasPermission('HOUSEKEEPING', 'reservations:approve')).toBe(false);
        expect(hasPermission('HOUSEKEEPING', 'guests:delete')).toBe(false);
        expect(hasPermission('HOUSEKEEPING', 'settings:edit')).toBe(false);
      });

      it('should grant access to manager for manager permissions', () => {
        expect(hasPermission('MANAGER', 'dashboard:view')).toBe(true);
        expect(hasPermission('MANAGER', 'dashboard:analytics')).toBe(true);
        expect(hasPermission('MANAGER', 'pricing:edit')).toBe(true);
        expect(hasPermission('MANAGER', 'housekeeping:manage')).toBe(true);
      });

      it('should deny access to manager for admin-only permissions', () => {
        expect(hasPermission('MANAGER', 'users:delete')).toBe(false);
        expect(hasPermission('MANAGER', 'integrations:manage')).toBe(false);
      });

      it('should grant access to maintenance for maintenance permissions', () => {
        expect(hasPermission('MAINTENANCE', 'dashboard:view')).toBe(true);
        expect(hasPermission('MAINTENANCE', 'rooms:manage')).toBe(true);
        expect(hasPermission('MAINTENANCE', 'maintenance:manage')).toBe(true);
        expect(hasPermission('MAINTENANCE', 'maintenance:create')).toBe(true);
      });

      it('should deny access to maintenance for restricted permissions', () => {
        expect(hasPermission('MAINTENANCE', 'reservations:create')).toBe(false);
        expect(hasPermission('MAINTENANCE', 'guests:edit')).toBe(false);
        expect(hasPermission('MAINTENANCE', 'pricing:edit')).toBe(false);
      });
    });

    describe('hasAnyPermission', () => {
      it('should return true if user has at least one of the required permissions', () => {
        expect(hasAnyPermission('RECEPTOR', ['dashboard:view', 'users:manage'])).toBe(true);
        expect(hasAnyPermission('HOUSEKEEPING', ['rooms:manage', 'reservations:approve'])).toBe(true);
      });

      it('should return false if user has none of the required permissions', () => {
        expect(hasAnyPermission('HOUSEKEEPING', ['users:manage', 'pricing:edit'])).toBe(false);
        expect(hasAnyPermission('RECEPTOR', ['integrations:manage', 'users:delete'])).toBe(false);
      });

      it('should return true for admin with any permissions', () => {
        expect(hasAnyPermission('ADMIN', ['nonexistent:permission', 'another:fake'])).toBe(true);
      });

      it('should handle empty permission array', () => {
        expect(hasAnyPermission('RECEPTOR', [])).toBe(false);
      });
    });

    describe('hasAllPermissions', () => {
      it('should return true if user has all required permissions', () => {
        expect(hasAllPermissions('RECEPTOR', ['dashboard:view', 'reservations:view'])).toBe(true);
        expect(hasAllPermissions('DIRECTOR', ['dashboard:view', 'users:manage', 'pricing:edit'])).toBe(true);
      });

      it('should return false if user is missing any required permission', () => {
        expect(hasAllPermissions('RECEPTOR', ['dashboard:view', 'users:manage'])).toBe(false);
        expect(hasAllPermissions('HOUSEKEEPING', ['rooms:manage', 'reservations:approve'])).toBe(false);
      });

      it('should return true for admin with any permissions', () => {
        expect(hasAllPermissions('ADMIN', ['nonexistent:permission', 'another:fake'])).toBe(true);
      });

      it('should handle empty permission array', () => {
        expect(hasAllPermissions('RECEPTOR', [])).toBe(true);
      });
    });

    describe('canPerformAction', () => {
      it('should correctly determine if role can perform specific action', () => {
        expect(canPerformAction('RECEPTOR', 'reservations', 'create')).toBe(true);
        expect(canPerformAction('RECEPTOR', 'reservations', 'delete')).toBe(false);
        expect(canPerformAction('DIRECTOR', 'users', 'manage')).toBe(true);
        expect(canPerformAction('HOUSEKEEPING', 'maintenance', 'create')).toBe(true);
        expect(canPerformAction('HOUSEKEEPING', 'guests', 'delete')).toBe(false);
      });

      it('should handle invalid categories', () => {
        expect(canPerformAction('RECEPTOR', 'invalid' as any, 'view' as any)).toBe(false);
      });
    });
  });

  describe('Permission utility functions', () => {
    describe('Dashboard permissions', () => {
      it('should correctly check dashboard access', () => {
        expect(permissions.canViewDashboard('DIRECTOR')).toBe(true);
        expect(permissions.canViewDashboard('RECEPTOR')).toBe(true);
        expect(permissions.canViewDashboard('HOUSEKEEPING')).toBe(true);
        expect(permissions.canViewDashboard('MAINTENANCE')).toBe(true);
        expect(permissions.canViewDashboard('MANAGER')).toBe(true);
        expect(permissions.canViewDashboard('ADMIN')).toBe(true);
      });

      it('should correctly check analytics access', () => {
        expect(permissions.canViewAnalytics('DIRECTOR')).toBe(true);
        expect(permissions.canViewAnalytics('RECEPTOR')).toBe(false);
        expect(permissions.canViewAnalytics('MANAGER')).toBe(true);
        expect(permissions.canViewAnalytics('ADMIN')).toBe(true);
      });
    });

    describe('Reservation permissions', () => {
      it('should correctly check reservation access', () => {
        expect(permissions.canViewReservations('DIRECTOR')).toBe(true);
        expect(permissions.canViewReservations('RECEPTOR')).toBe(true);
        expect(permissions.canViewReservations('HOUSEKEEPING')).toBe(false);
        expect(permissions.canViewReservations('MAINTENANCE')).toBe(false);
        expect(permissions.canViewReservations('MANAGER')).toBe(true);
        expect(permissions.canViewReservations('ADMIN')).toBe(true);
      });

      it('should correctly check reservation creation', () => {
        expect(permissions.canCreateReservations('DIRECTOR')).toBe(true);
        expect(permissions.canCreateReservations('RECEPTOR')).toBe(true);
        expect(permissions.canCreateReservations('HOUSEKEEPING')).toBe(false);
        expect(permissions.canCreateReservations('MANAGER')).toBe(false);
        expect(permissions.canCreateReservations('ADMIN')).toBe(true);
      });

      it('should correctly check reservation editing', () => {
        expect(permissions.canEditReservations('DIRECTOR')).toBe(true);
        expect(permissions.canEditReservations('RECEPTOR')).toBe(true);
        expect(permissions.canEditReservations('HOUSEKEEPING')).toBe(false);
        expect(permissions.canEditReservations('MANAGER')).toBe(true);
        expect(permissions.canEditReservations('ADMIN')).toBe(true);
      });

      it('should correctly check reservation deletion', () => {
        expect(permissions.canDeleteReservations('DIRECTOR')).toBe(true);
        expect(permissions.canDeleteReservations('RECEPTOR')).toBe(false);
        expect(permissions.canDeleteReservations('HOUSEKEEPING')).toBe(false);
        expect(permissions.canDeleteReservations('MANAGER')).toBe(false);
        expect(permissions.canDeleteReservations('ADMIN')).toBe(true);
      });

      it('should correctly check reservation approval', () => {
        expect(permissions.canApproveReservations('DIRECTOR')).toBe(true);
        expect(permissions.canApproveReservations('RECEPTOR')).toBe(false);
        expect(permissions.canApproveReservations('MANAGER')).toBe(true);
        expect(permissions.canApproveReservations('ADMIN')).toBe(true);
      });

      it('should correctly check check-in operations', () => {
        expect(permissions.canCheckInGuests('DIRECTOR')).toBe(true);
        expect(permissions.canCheckInGuests('RECEPTOR')).toBe(true);
        expect(permissions.canCheckInGuests('HOUSEKEEPING')).toBe(false);
        expect(permissions.canCheckInGuests('MANAGER')).toBe(false);
        expect(permissions.canCheckInGuests('ADMIN')).toBe(true);
      });

      it('should correctly check check-out operations', () => {
        expect(permissions.canCheckOutGuests('DIRECTOR')).toBe(true);
        expect(permissions.canCheckOutGuests('RECEPTOR')).toBe(true);
        expect(permissions.canCheckOutGuests('HOUSEKEEPING')).toBe(false);
        expect(permissions.canCheckOutGuests('MANAGER')).toBe(false);
        expect(permissions.canCheckOutGuests('ADMIN')).toBe(true);
      });
    });

    describe('Guest permissions', () => {
      it('should correctly check guest access', () => {
        expect(permissions.canViewGuests('DIRECTOR')).toBe(true);
        expect(permissions.canViewGuests('RECEPTOR')).toBe(true);
        expect(permissions.canViewGuests('HOUSEKEEPING')).toBe(true);
        expect(permissions.canViewGuests('MAINTENANCE')).toBe(true);
        expect(permissions.canViewGuests('MANAGER')).toBe(true);
        expect(permissions.canViewGuests('ADMIN')).toBe(true);
      });

      it('should correctly check guest creation', () => {
        expect(permissions.canCreateGuests('DIRECTOR')).toBe(true);
        expect(permissions.canCreateGuests('RECEPTOR')).toBe(true);
        expect(permissions.canCreateGuests('HOUSEKEEPING')).toBe(false);
        expect(permissions.canCreateGuests('MAINTENANCE')).toBe(false);
        expect(permissions.canCreateGuests('MANAGER')).toBe(false);
        expect(permissions.canCreateGuests('ADMIN')).toBe(true);
      });

      it('should correctly check guest editing', () => {
        expect(permissions.canEditGuests('DIRECTOR')).toBe(true);
        expect(permissions.canEditGuests('RECEPTOR')).toBe(true);
        expect(permissions.canEditGuests('HOUSEKEEPING')).toBe(false);
        expect(permissions.canEditGuests('MAINTENANCE')).toBe(false);
        expect(permissions.canEditGuests('MANAGER')).toBe(true);
        expect(permissions.canEditGuests('ADMIN')).toBe(true);
      });

      it('should correctly check guest deletion', () => {
        expect(permissions.canDeleteGuests('DIRECTOR')).toBe(true);
        expect(permissions.canDeleteGuests('RECEPTOR')).toBe(false);
        expect(permissions.canDeleteGuests('HOUSEKEEPING')).toBe(false);
        expect(permissions.canDeleteGuests('MAINTENANCE')).toBe(false);
        expect(permissions.canDeleteGuests('MANAGER')).toBe(false);
        expect(permissions.canDeleteGuests('ADMIN')).toBe(true);
      });

      it('should correctly check guest search', () => {
        expect(permissions.canSearchGuests('DIRECTOR')).toBe(true);
        expect(permissions.canSearchGuests('RECEPTOR')).toBe(true);
        expect(permissions.canSearchGuests('HOUSEKEEPING')).toBe(false);
        expect(permissions.canSearchGuests('MAINTENANCE')).toBe(false);
        expect(permissions.canSearchGuests('MANAGER')).toBe(true);
        expect(permissions.canSearchGuests('ADMIN')).toBe(true);
      });
    });

    describe('Room permissions', () => {
      it('should correctly check room access', () => {
        expect(permissions.canViewRooms('DIRECTOR')).toBe(true);
        expect(permissions.canViewRooms('RECEPTOR')).toBe(true);
        expect(permissions.canViewRooms('HOUSEKEEPING')).toBe(true);
        expect(permissions.canViewRooms('MAINTENANCE')).toBe(true);
        expect(permissions.canViewRooms('MANAGER')).toBe(true);
        expect(permissions.canViewRooms('ADMIN')).toBe(true);
      });

      it('should correctly check room creation', () => {
        expect(permissions.canCreateRooms('DIRECTOR')).toBe(true);
        expect(permissions.canCreateRooms('RECEPTOR')).toBe(false);
        expect(permissions.canCreateRooms('HOUSEKEEPING')).toBe(false);
        expect(permissions.canCreateRooms('MAINTENANCE')).toBe(false);
        expect(permissions.canCreateRooms('MANAGER')).toBe(false);
        expect(permissions.canCreateRooms('ADMIN')).toBe(true);
      });

      it('should correctly check room editing', () => {
        expect(permissions.canEditRooms('DIRECTOR')).toBe(true);
        expect(permissions.canEditRooms('RECEPTOR')).toBe(false);
        expect(permissions.canEditRooms('HOUSEKEEPING')).toBe(false);
        expect(permissions.canEditRooms('MAINTENANCE')).toBe(false);
        expect(permissions.canEditRooms('MANAGER')).toBe(true);
        expect(permissions.canEditRooms('ADMIN')).toBe(true);
      });

      it('should correctly check room deletion', () => {
        expect(permissions.canDeleteRooms('DIRECTOR')).toBe(true);
        expect(permissions.canDeleteRooms('RECEPTOR')).toBe(false);
        expect(permissions.canDeleteRooms('HOUSEKEEPING')).toBe(false);
        expect(permissions.canDeleteRooms('MAINTENANCE')).toBe(false);
        expect(permissions.canDeleteRooms('MANAGER')).toBe(false);
        expect(permissions.canDeleteRooms('ADMIN')).toBe(true);
      });

      it('should correctly check room management', () => {
        expect(permissions.canManageRooms('DIRECTOR')).toBe(true);
        expect(permissions.canManageRooms('RECEPTOR')).toBe(true);
        expect(permissions.canManageRooms('HOUSEKEEPING')).toBe(true);
        expect(permissions.canManageRooms('MAINTENANCE')).toBe(true);
        expect(permissions.canManageRooms('MANAGER')).toBe(true);
        expect(permissions.canManageRooms('ADMIN')).toBe(true);
      });
    });

    describe('Housekeeping permissions', () => {
      it('should correctly check housekeeping access', () => {
        expect(permissions.canViewHousekeeping('DIRECTOR')).toBe(true);
        expect(permissions.canViewHousekeeping('RECEPTOR')).toBe(true);
        expect(permissions.canViewHousekeeping('HOUSEKEEPING')).toBe(true);
        expect(permissions.canViewHousekeeping('MAINTENANCE')).toBe(true);
        expect(permissions.canViewHousekeeping('MANAGER')).toBe(true);
        expect(permissions.canViewHousekeeping('ADMIN')).toBe(true);
      });

      it('should correctly check housekeeping assignment', () => {
        expect(permissions.canAssignHousekeeping('DIRECTOR')).toBe(true);
        expect(permissions.canAssignHousekeeping('RECEPTOR')).toBe(true);
        expect(permissions.canAssignHousekeeping('HOUSEKEEPING')).toBe(true);
        expect(permissions.canAssignHousekeeping('MAINTENANCE')).toBe(false);
        expect(permissions.canAssignHousekeeping('MANAGER')).toBe(true);
        expect(permissions.canAssignHousekeeping('ADMIN')).toBe(true);
      });

      it('should correctly check housekeeping management', () => {
        expect(permissions.canManageHousekeeping('DIRECTOR')).toBe(true);
        expect(permissions.canManageHousekeeping('RECEPTOR')).toBe(false);
        expect(permissions.canManageHousekeeping('HOUSEKEEPING')).toBe(true);
        expect(permissions.canManageHousekeeping('MAINTENANCE')).toBe(false);
        expect(permissions.canManageHousekeeping('MANAGER')).toBe(true);
        expect(permissions.canManageHousekeeping('ADMIN')).toBe(true);
      });
    });

    describe('Maintenance permissions', () => {
      it('should correctly check maintenance access', () => {
        expect(permissions.canViewMaintenance('DIRECTOR')).toBe(true);
        expect(permissions.canViewMaintenance('RECEPTOR')).toBe(true);
        expect(permissions.canViewMaintenance('HOUSEKEEPING')).toBe(true);
        expect(permissions.canViewMaintenance('MAINTENANCE')).toBe(true);
        expect(permissions.canViewMaintenance('MANAGER')).toBe(true);
        expect(permissions.canViewMaintenance('ADMIN')).toBe(true);
      });

      it('should correctly check maintenance creation', () => {
        expect(permissions.canCreateMaintenance('DIRECTOR')).toBe(true);
        expect(permissions.canCreateMaintenance('RECEPTOR')).toBe(true);
        expect(permissions.canCreateMaintenance('HOUSEKEEPING')).toBe(true);
        expect(permissions.canCreateMaintenance('MAINTENANCE')).toBe(true);
        expect(permissions.canCreateMaintenance('MANAGER')).toBe(true);
        expect(permissions.canCreateMaintenance('ADMIN')).toBe(true);
      });

      it('should correctly check maintenance assignment', () => {
        expect(permissions.canAssignMaintenance('DIRECTOR')).toBe(true);
        expect(permissions.canAssignMaintenance('RECEPTOR')).toBe(false);
        expect(permissions.canAssignMaintenance('HOUSEKEEPING')).toBe(false);
        expect(permissions.canAssignMaintenance('MAINTENANCE')).toBe(true);
        expect(permissions.canAssignMaintenance('MANAGER')).toBe(true);
        expect(permissions.canAssignMaintenance('ADMIN')).toBe(true);
      });

      it('should correctly check maintenance management', () => {
        expect(permissions.canManageMaintenance('DIRECTOR')).toBe(true);
        expect(permissions.canManageMaintenance('RECEPTOR')).toBe(false);
        expect(permissions.canManageMaintenance('HOUSEKEEPING')).toBe(false);
        expect(permissions.canManageMaintenance('MAINTENANCE')).toBe(true);
        expect(permissions.canManageMaintenance('MANAGER')).toBe(true);
        expect(permissions.canManageMaintenance('ADMIN')).toBe(true);
      });
    });

    describe('Reports permissions', () => {
      it('should correctly check reports access', () => {
        expect(permissions.canViewReports('DIRECTOR')).toBe(true);
        expect(permissions.canViewReports('RECEPTOR')).toBe(true);
        expect(permissions.canViewReports('HOUSEKEEPING')).toBe(true);
        expect(permissions.canViewReports('MAINTENANCE')).toBe(true);
        expect(permissions.canViewReports('MANAGER')).toBe(true);
        expect(permissions.canViewReports('ADMIN')).toBe(true);
      });

      it('should correctly check reports export', () => {
        expect(permissions.canExportReports('DIRECTOR')).toBe(true);
        expect(permissions.canExportReports('RECEPTOR')).toBe(true);
        expect(permissions.canExportReports('HOUSEKEEPING')).toBe(false);
        expect(permissions.canExportReports('MAINTENANCE')).toBe(false);
        expect(permissions.canExportReports('MANAGER')).toBe(true);
        expect(permissions.canExportReports('ADMIN')).toBe(true);
      });

      it('should correctly check analytics access', () => {
        expect(permissions.canViewAnalytics('DIRECTOR')).toBe(true);
        expect(permissions.canViewAnalytics('RECEPTOR')).toBe(false);
        expect(permissions.canViewAnalytics('HOUSEKEEPING')).toBe(false);
        expect(permissions.canViewAnalytics('MAINTENANCE')).toBe(false);
        expect(permissions.canViewAnalytics('MANAGER')).toBe(true);
        expect(permissions.canViewAnalytics('ADMIN')).toBe(true);
      });
    });

    describe('Settings permissions', () => {
      it('should correctly check settings access', () => {
        expect(permissions.canViewSettings('DIRECTOR')).toBe(true);
        expect(permissions.canViewSettings('RECEPTOR')).toBe(true);
        expect(permissions.canViewSettings('HOUSEKEEPING')).toBe(false);
        expect(permissions.canViewSettings('MAINTENANCE')).toBe(false);
        expect(permissions.canViewSettings('MANAGER')).toBe(true);
        expect(permissions.canViewSettings('ADMIN')).toBe(true);
      });

      it('should correctly check settings editing', () => {
        expect(permissions.canEditSettings('DIRECTOR')).toBe(true);
        expect(permissions.canEditSettings('RECEPTOR')).toBe(false);
        expect(permissions.canEditSettings('HOUSEKEEPING')).toBe(false);
        expect(permissions.canEditSettings('MAINTENANCE')).toBe(false);
        expect(permissions.canEditSettings('MANAGER')).toBe(true);
        expect(permissions.canEditSettings('ADMIN')).toBe(true);
      });
    });

    describe('User management permissions', () => {
      it('should correctly check user access', () => {
        expect(permissions.canViewUsers('DIRECTOR')).toBe(true);
        expect(permissions.canViewUsers('RECEPTOR')).toBe(false);
        expect(permissions.canViewUsers('HOUSEKEEPING')).toBe(false);
        expect(permissions.canViewUsers('MAINTENANCE')).toBe(false);
        expect(permissions.canViewUsers('MANAGER')).toBe(false);
        expect(permissions.canViewUsers('ADMIN')).toBe(true);
      });

      it('should correctly check user creation', () => {
        expect(permissions.canCreateUsers('DIRECTOR')).toBe(true);
        expect(permissions.canCreateUsers('RECEPTOR')).toBe(false);
        expect(permissions.canCreateUsers('HOUSEKEEPING')).toBe(false);
        expect(permissions.canCreateUsers('MAINTENANCE')).toBe(false);
        expect(permissions.canCreateUsers('MANAGER')).toBe(false);
        expect(permissions.canCreateUsers('ADMIN')).toBe(true);
      });

      it('should correctly check user editing', () => {
        expect(permissions.canEditUsers('DIRECTOR')).toBe(true);
        expect(permissions.canEditUsers('RECEPTOR')).toBe(false);
        expect(permissions.canEditUsers('HOUSEKEEPING')).toBe(false);
        expect(permissions.canEditUsers('MAINTENANCE')).toBe(false);
        expect(permissions.canEditUsers('MANAGER')).toBe(false);
        expect(permissions.canEditUsers('ADMIN')).toBe(true);
      });

      it('should correctly check user deletion', () => {
        expect(permissions.canDeleteUsers('DIRECTOR')).toBe(true);
        expect(permissions.canDeleteUsers('RECEPTOR')).toBe(false);
        expect(permissions.canDeleteUsers('HOUSEKEEPING')).toBe(false);
        expect(permissions.canDeleteUsers('MAINTENANCE')).toBe(false);
        expect(permissions.canDeleteUsers('MANAGER')).toBe(false);
        expect(permissions.canDeleteUsers('ADMIN')).toBe(true);
      });

      it('should correctly check user management', () => {
        expect(permissions.canManageUsers('DIRECTOR')).toBe(true);
        expect(permissions.canManageUsers('RECEPTOR')).toBe(false);
        expect(permissions.canManageUsers('HOUSEKEEPING')).toBe(false);
        expect(permissions.canManageUsers('MAINTENANCE')).toBe(false);
        expect(permissions.canManageUsers('MANAGER')).toBe(false);
        expect(permissions.canManageUsers('ADMIN')).toBe(true);
      });
    });

    describe('Property permissions', () => {
      it('should correctly check property access', () => {
        expect(permissions.canViewProperties('DIRECTOR')).toBe(true);
        expect(permissions.canViewProperties('RECEPTOR')).toBe(false);
        expect(permissions.canViewProperties('HOUSEKEEPING')).toBe(false);
        expect(permissions.canViewProperties('MAINTENANCE')).toBe(false);
        expect(permissions.canViewProperties('MANAGER')).toBe(true);
        expect(permissions.canViewProperties('ADMIN')).toBe(true);
      });

      it('should correctly check property creation', () => {
        expect(permissions.canCreateProperties('DIRECTOR')).toBe(true);
        expect(permissions.canCreateProperties('RECEPTOR')).toBe(false);
        expect(permissions.canCreateProperties('HOUSEKEEPING')).toBe(false);
        expect(permissions.canCreateProperties('MAINTENANCE')).toBe(false);
        expect(permissions.canCreateProperties('MANAGER')).toBe(false);
        expect(permissions.canCreateProperties('ADMIN')).toBe(true);
      });

      it('should correctly check property editing', () => {
        expect(permissions.canEditProperties('DIRECTOR')).toBe(true);
        expect(permissions.canEditProperties('RECEPTOR')).toBe(false);
        expect(permissions.canEditProperties('HOUSEKEEPING')).toBe(false);
        expect(permissions.canEditProperties('MAINTENANCE')).toBe(false);
        expect(permissions.canEditProperties('MANAGER')).toBe(true);
        expect(permissions.canEditProperties('ADMIN')).toBe(true);
      });

      it('should correctly check property deletion', () => {
        expect(permissions.canDeleteProperties('DIRECTOR')).toBe(true);
        expect(permissions.canDeleteProperties('RECEPTOR')).toBe(false);
        expect(permissions.canDeleteProperties('HOUSEKEEPING')).toBe(false);
        expect(permissions.canDeleteProperties('MAINTENANCE')).toBe(false);
        expect(permissions.canDeleteProperties('MANAGER')).toBe(false);
        expect(permissions.canDeleteProperties('ADMIN')).toBe(true);
      });
    });

    describe('Pricing permissions', () => {
      it('should correctly check pricing access', () => {
        expect(permissions.canViewPricing('DIRECTOR')).toBe(true);
        expect(permissions.canViewPricing('RECEPTOR')).toBe(false);
        expect(permissions.canViewPricing('HOUSEKEEPING')).toBe(false);
        expect(permissions.canViewPricing('MAINTENANCE')).toBe(false);
        expect(permissions.canViewPricing('MANAGER')).toBe(true);
        expect(permissions.canViewPricing('ADMIN')).toBe(true);
      });

      it('should correctly check pricing editing', () => {
        expect(permissions.canEditPricing('DIRECTOR')).toBe(true);
        expect(permissions.canEditPricing('RECEPTOR')).toBe(false);
        expect(permissions.canEditPricing('HOUSEKEEPING')).toBe(false);
        expect(permissions.canEditPricing('MAINTENANCE')).toBe(false);
        expect(permissions.canEditPricing('MANAGER')).toBe(true);
        expect(permissions.canEditPricing('ADMIN')).toBe(true);
      });
    });

    describe('Integration permissions', () => {
      it('should correctly check integration access', () => {
        expect(permissions.canViewIntegrations('DIRECTOR')).toBe(true);
        expect(permissions.canViewIntegrations('RECEPTOR')).toBe(false);
        expect(permissions.canViewIntegrations('HOUSEKEEPING')).toBe(false);
        expect(permissions.canViewIntegrations('MAINTENANCE')).toBe(false);
        expect(permissions.canViewIntegrations('MANAGER')).toBe(false);
        expect(permissions.canViewIntegrations('ADMIN')).toBe(true);
      });

      it('should correctly check integration management', () => {
        expect(permissions.canManageIntegrations('DIRECTOR')).toBe(true);
        expect(permissions.canManageIntegrations('RECEPTOR')).toBe(false);
        expect(permissions.canManageIntegrations('HOUSEKEEPING')).toBe(false);
        expect(permissions.canManageIntegrations('MAINTENANCE')).toBe(false);
        expect(permissions.canManageIntegrations('MANAGER')).toBe(false);
        expect(permissions.canManageIntegrations('ADMIN')).toBe(true);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle invalid roles gracefully', () => {
      expect(hasPermission('INVALID_ROLE' as UserRole, 'dashboard:view')).toBe(false);
      expect(hasAnyPermission('INVALID_ROLE' as UserRole, ['dashboard:view'])).toBe(false);
      expect(hasAllPermissions('INVALID_ROLE' as UserRole, ['dashboard:view'])).toBe(false);
    });

    it('should handle invalid permissions gracefully', () => {
      expect(hasPermission('RECEPTOR', '')).toBe(false);
      expect(hasPermission('RECEPTOR', 'invalid:permission')).toBe(false);
      expect(hasPermission('RECEPTOR', 'invalid')).toBe(false);
    });

    it('should handle null/undefined inputs gracefully', () => {
      expect(hasPermission(null as any, 'dashboard:view')).toBe(false);
      expect(hasPermission(undefined as any, 'dashboard:view')).toBe(false);
      expect(hasPermission('RECEPTOR', null as any)).toBe(false);
      expect(hasPermission('RECEPTOR', undefined as any)).toBe(false);
    });
  });

  describe('Permission consistency', () => {
    it('should ensure admin has access to all permissions', () => {
      const allPermissions = [
        'dashboard:view', 'dashboard:analytics',
        'reservations:view', 'reservations:create', 'reservations:edit', 'reservations:delete',
        'reservations:approve', 'reservations:checkin', 'reservations:checkout',
        'guests:view', 'guests:create', 'guests:edit', 'guests:delete', 'guests:search',
        'rooms:view', 'rooms:create', 'rooms:edit', 'rooms:delete', 'rooms:manage',
        'housekeeping:view', 'housekeeping:assign', 'housekeeping:manage',
        'maintenance:view', 'maintenance:create', 'maintenance:assign', 'maintenance:manage',
        'reports:view', 'reports:export', 'reports:analytics',
        'settings:view', 'settings:edit',
        'users:view', 'users:create', 'users:edit', 'users:delete', 'users:manage',
        'properties:view', 'properties:create', 'properties:edit', 'properties:delete',
        'pricing:view', 'pricing:edit',
        'integrations:view', 'integrations:manage',
      ];

      allPermissions.forEach(permission => {
        expect(hasPermission('ADMIN', permission as any)).toBe(true);
      });
    });

    it('should ensure receptor has access to basic operations', () => {
      const receptorPermissions = [
        'dashboard:view',
        'reservations:view', 'reservations:create', 'reservations:edit',
        'reservations:checkin', 'reservations:checkout',
        'guests:view', 'guests:create', 'guests:edit', 'guests:search',
        'rooms:view', 'rooms:manage',
        'housekeeping:view', 'housekeeping:assign',
        'maintenance:view', 'maintenance:create',
        'reports:view', 'reports:export',
        'settings:view',
      ];

      receptorPermissions.forEach(permission => {
        expect(hasPermission('RECEPTOR', permission as any)).toBe(true);
      });
    });

    it('should ensure housekeeping has limited access', () => {
      const housekeepingAllowed = [
        'dashboard:view',
        'rooms:view', 'rooms:manage',
        'housekeeping:view', 'housekeeping:assign', 'housekeeping:manage',
        'maintenance:view', 'maintenance:create',
        'guests:view',
        'reports:view',
      ];

      const housekeepingDenied = [
        'reservations:delete', 'reservations:approve',
        'guests:delete',
        'rooms:create', 'rooms:edit', 'rooms:delete',
        'settings:edit',
        'users:manage',
        'properties:manage',
        'pricing:edit',
        'integrations:manage',
      ];

      housekeepingAllowed.forEach(permission => {
        expect(hasPermission('HOUSEKEEPING', permission as any)).toBe(true);
      });

      housekeepingDenied.forEach(permission => {
        expect(hasPermission('HOUSEKEEPING', permission as any)).toBe(false);
      });
    });
  });
});
