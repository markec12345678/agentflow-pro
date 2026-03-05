export const kpis = {
  // Avtomatizacija
  autoApprovalRate: { target: 70, unit: '%' },
  manualInterventionsPerDay: { target: 5, unit: 'count' },
  
  // Poslovanje
  occupancyRate: { target: 75, unit: '%' },
  averageDailyRate: { target: 100, unit: 'EUR' },
  revenuePerAvailableRoom: { target: 75, unit: 'EUR' },
  
  // Sistem
  uptime: { target: 99.9, unit: '%' },
  errorRate: { target: 0.1, unit: '%' },
  avgResponseTime: { target: 500, unit: 'ms' },
  
  // Gostje
  guestSatisfaction: { target: 4.5, unit: 'stars' },
  repeatGuestRate: { target: 30, unit: '%' },
  
  // eTurizem
  syncSuccessRate: { target: 99, unit: '%' },
  syncFrequency: { target: 4, unit: 'hours' }
};
