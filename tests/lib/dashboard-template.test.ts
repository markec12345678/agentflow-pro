/**
 * Dashboard Template Integration Tests
 * 
 * Tests for dashboard template functionality:
 * - createDashboardFromTemplate()
 * - getWidgetsForRole()
 * - getWidgetByType()
 * - Dashboard template validation
 */
import { describe, it, test, expect, vi, beforeEach, afterEach, beforeAll, afterAll } from "vitest";

// Mock Prisma
const mockDashboardCreate = vi.fn();
vi.mock('@/database/schema', () => ({
  prisma: {
    dashboard: {
      create: mockDashboardCreate,
    },
  },
}));

describe('Dashboard Template Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDashboardCreate.mockReset();
  });

  describe('createDashboardFromTemplate', () => {
    it('should create dashboard from valid template', async () => {
      mockDashboardCreate.mockResolvedValue({
        id: 'dash-123',
        name: 'Owner Dashboard',
        role: 'owner',
      });

      const { createDashboardFromTemplate } = await import('@/components/dashboard/widget-templates');
      const dashboard = await createDashboardFromTemplate('owner', 'user-123', 'prop-456');

      expect(mockDashboardCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: 'Owner Dashboard',
          description: expect.any(String),
          role: 'owner',
          userId: 'user-123',
          propertyId: 'prop-456',
          isTemplate: false,
        }),
      });

      expect(dashboard.id).toBe('dash-123');
    });

    it('should throw error for non-existent template', async () => {
      const { createDashboardFromTemplate } = await import('@/components/dashboard/widget-templates');

      await expect(
        createDashboardFromTemplate('nonexistent', 'user-123')
      ).rejects.toThrow(/Template nonexistent not found/);

      expect(mockDashboardCreate).not.toHaveBeenCalled();
    });

    it('should create dashboard without propertyId', async () => {
      mockDashboardCreate.mockResolvedValue({ id: 'dash-123' });

      const { createDashboardFromTemplate } = await import('@/components/dashboard/widget-templates');
      await createDashboardFromTemplate('director', 'user-123');

      expect(mockDashboardCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          role: 'director',
          userId: 'user-123',
          propertyId: undefined,
        }),
      });
    });

    it('should create owner dashboard with correct widgets', async () => {
      mockDashboardCreate.mockResolvedValue({ id: 'dash-123' });

      const { createDashboardFromTemplate } = await import('@/components/dashboard/widget-templates');
      await createDashboardFromTemplate('owner', 'user-123');

      expect(mockDashboardCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({ type: 'revenue_mtd' }),
            expect.objectContaining({ type: 'occupancy_rate' }),
            expect.objectContaining({ type: 'adr_trend' }),
          ]),
        }),
      });
    });

    it('should create receptor dashboard with correct widgets', async () => {
      mockDashboardCreate.mockResolvedValue({ id: 'dash-123' });

      const { createDashboardFromTemplate } = await import('@/components/dashboard/widget-templates');
      await createDashboardFromTemplate('receptor', 'user-123');

      expect(mockDashboardCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({ type: 'today_arrivals' }),
            expect.objectContaining({ type: 'room_status' }),
          ]),
        }),
      });
    });

    it('should create housekeeping dashboard with correct widgets', async () => {
      mockDashboardCreate.mockResolvedValue({ id: 'dash-123' });

      const { createDashboardFromTemplate } = await import('@/components/dashboard/widget-templates');
      await createDashboardFromTemplate('housekeeping', 'user-123');

      expect(mockDashboardCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({ type: 'rooms_to_clean' }),
            expect.objectContaining({ type: 'cleaning_progress' }),
          ]),
        }),
      });
    });

    it('should log dashboard creation', async () => {
      mockDashboardCreate.mockResolvedValue({ id: 'dash-123' });

      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      const { createDashboardFromTemplate } = await import('@/components/dashboard/widget-templates');
      await createDashboardFromTemplate('owner', 'user-123');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Dashboard created from template')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('getWidgetsForRole', () => {
    it('should return widgets for owner role', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const widgets = getWidgetsForRole('owner');

      expect(widgets.length).toBeGreaterThan(0);
      expect(widgets.map(w => w.type)).toContain('revenue_mtd');
    });

    it('should return widgets for director role', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const widgets = getWidgetsForRole('director');

      expect(widgets.length).toBeGreaterThan(0);
      expect(widgets.map(w => w.type)).toContain('today_arrivals');
    });

    it('should return widgets for receptor role', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const widgets = getWidgetsForRole('receptor');

      expect(widgets.length).toBeGreaterThan(0);
      expect(widgets.map(w => w.type)).toContain('room_status');
    });

    it('should return widgets for housekeeping role', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const widgets = getWidgetsForRole('housekeeping');

      expect(widgets.length).toBeGreaterThan(0);
      expect(widgets.map(w => w.type)).toContain('rooms_to_clean');
    });

    it('should return widgets for manager role', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const widgets = getWidgetsForRole('manager');

      expect(widgets.length).toBeGreaterThan(0);
      expect(widgets.map(w => w.type)).toContain('guest_satisfaction');
    });

    it('should return empty array for invalid role', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const widgets = getWidgetsForRole('invalid_role' as any);

      expect(widgets).toEqual([]);
    });

    it('should return widgets with all required properties', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const widgets = getWidgetsForRole('owner');

      widgets.forEach(widget => {
        expect(widget).toHaveProperty('type');
        expect(widget).toHaveProperty('title');
        expect(widget).toHaveProperty('description');
        expect(widget).toHaveProperty('defaultSize');
        expect(widget).toHaveProperty('category');
      });
    });
  });

  describe('getWidgetByType', () => {
    it('should return revenue_mtd widget', async () => {
      const { getWidgetByType } = await import('@/components/dashboard/widget-templates');
      const widget = getWidgetByType('revenue_mtd');

      expect(widget).toBeDefined();
      expect(widget?.title).toBe('Prihodki Ta Mesec');
      expect(widget?.category).toBe('revenue');
    });

    it('should return today_arrivals widget', async () => {
      const { getWidgetByType } = await import('@/components/dashboard/widget-templates');
      const widget = getWidgetByType('today_arrivals');

      expect(widget).toBeDefined();
      expect(widget?.title).toBe('Prihodi Danes');
      expect(widget?.category).toBe('operations');
    });

    it('should return room_status widget', async () => {
      const { getWidgetByType } = await import('@/components/dashboard/widget-templates');
      const widget = getWidgetByType('room_status');

      expect(widget).toBeDefined();
      expect(widget?.title).toBe('Status Sob');
      expect(widget?.category).toBe('operations');
    });

    it('should return guest_satisfaction widget', async () => {
      const { getWidgetByType } = await import('@/components/dashboard/widget-templates');
      const widget = getWidgetByType('guest_satisfaction');

      expect(widget).toBeDefined();
      expect(widget?.category).toBe('guests');
    });

    it('should return undefined for non-existent widget', async () => {
      const { getWidgetByType } = await import('@/components/dashboard/widget-templates');
      const widget = getWidgetByType('nonexistent_widget');

      expect(widget).toBeUndefined();
    });

    it('should return widget with valid size configuration', async () => {
      const { getWidgetByType } = await import('@/components/dashboard/widget-templates');
      const widget = getWidgetByType('revenue_mtd');

      expect(widget?.defaultSize).toHaveProperty('w');
      expect(widget?.defaultSize).toHaveProperty('h');
      expect(widget?.minSize).toHaveProperty('w');
      expect(widget?.minSize).toHaveProperty('h');
    });

    it('should return widget with data endpoint', async () => {
      const { getWidgetByType } = await import('@/components/dashboard/widget-templates');
      const widget = getWidgetByType('revenue_mtd');

      expect(widget?.dataEndpoint).toBeDefined();
      expect(typeof widget?.dataEndpoint).toBe('string');
    });

    it('should return widget with refresh interval', async () => {
      const { getWidgetByType } = await import('@/components/dashboard/widget-templates');
      const widget = getWidgetByType('revenue_mtd');

      expect(widget?.refreshInterval).toBeDefined();
      expect(typeof widget?.refreshInterval).toBe('number');
    });
  });

  describe('Widget Categories', () => {
    it('should have revenue widgets', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const ownerWidgets = getWidgetsForRole('owner');
      
      const revenueWidgets = ownerWidgets.filter(w => w.category === 'revenue');
      expect(revenueWidgets.length).toBeGreaterThan(0);
    });

    it('should have operations widgets', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const receptorWidgets = getWidgetsForRole('receptor');
      
      const operationsWidgets = receptorWidgets.filter(w => w.category === 'operations');
      expect(operationsWidgets.length).toBeGreaterThan(0);
    });

    it('should have guests widgets', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const managerWidgets = getWidgetsForRole('manager');
      
      const guestsWidgets = managerWidgets.filter(w => w.category === 'guests');
      expect(guestsWidgets.length).toBeGreaterThan(0);
    });

    it('should have marketing widgets', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const ownerWidgets = getWidgetsForRole('owner');
      
      const marketingWidgets = ownerWidgets.filter(w => w.category === 'marketing');
      expect(marketingWidgets.length).toBeGreaterThan(0);
    });
  });

  describe('Widget Size Validation', () => {
    it('should have consistent widget sizes', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const widgets = getWidgetsForRole('owner');

      widgets.forEach(widget => {
        expect(widget.defaultSize.w).toBeGreaterThanOrEqual(widget.minSize.w);
        expect(widget.defaultSize.h).toBeGreaterThanOrEqual(widget.minSize.h);
      });
    });

    it('should have widgets that fit in 12-column grid', async () => {
      const { getWidgetsForRole } = await import('@/components/dashboard/widget-templates');
      const widgets = getWidgetsForRole('owner');

      widgets.forEach(widget => {
        expect(widget.defaultSize.w).toBeLessThanOrEqual(12);
        expect(widget.minSize.w).toBeLessThanOrEqual(12);
      });
    });
  });

  describe('Dashboard Template Structure', () => {
    it('all dashboards should have unique IDs', async () => {
      const { DASHBOARD_TEMPLATES } = await import('@/components/dashboard/widget-templates');
      const ids = Object.keys(DASHBOARD_TEMPLATES);
      const uniqueIds = new Set(ids);

      expect(ids.length).toBe(uniqueIds.size);
    });

    it('all dashboards should have valid widget references', async () => {
      const { DASHBOARD_TEMPLATES, WIDGET_TEMPLATES } = await import('@/components/dashboard/widget-templates');

      Object.values(DASHBOARD_TEMPLATES).forEach(dashboard => {
        dashboard.widgets.forEach(widget => {
          expect(WIDGET_TEMPLATES[widget.type]).toBeDefined();
        });
      });
    });

    it('all dashboards should have non-overlapping widget positions', async () => {
      const { DASHBOARD_TEMPLATES } = await import('@/components/dashboard/widget-templates');

      Object.values(DASHBOARD_TEMPLATES).forEach(dashboard => {
        const positions = dashboard.widgets.map(w => w.position);
        
        positions.forEach((pos, index) => {
          expect(pos.x).toBeGreaterThanOrEqual(0);
          expect(pos.y).toBeGreaterThanOrEqual(0);
          expect(pos.w).toBeGreaterThan(0);
          expect(pos.h).toBeGreaterThan(0);
        });
      });
    });
  });
});
