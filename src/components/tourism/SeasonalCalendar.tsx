import React, { useState } from 'react';
import { SeasonalIndicator } from './TourismContext';

export interface SeasonalCalendarProps {
  season: 'summer' | 'winter' | 'spring' | 'autumn';
  year: number;
  month: number;
  reservations?: Array<{
    date: string;
    status: 'booked' | 'pending' | 'available';
    price?: number;
  }>;
  onDateClick?: (date: string) => void;
}

export const SeasonalCalendar: React.FC<SeasonalCalendarProps> = ({
  season,
  year,
  month,
  reservations = [],
  onDateClick
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Get days in month
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfMonth = new Date(year, month - 1, 1).getDay();

  // Create calendar days
  const calendarDays = [];

  // Add empty days for starting offset
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null);
  }

  // Add actual days
  for (let i = 1; i <= daysInMonth; i++) {
    const dateStr = `${year}-${month.toString().padStart(2, '0')}-${i.toString().padStart(2, '0')}`;
    const dayReservations = reservations.find(r => r.date === dateStr);

    calendarDays.push({
      day: i,
      date: dateStr,
      status: dayReservations?.status || 'available',
      price: dayReservations?.price
    });
  }

  // Split into weeks
  const weeks = [];
  for (let i = 0; i < calendarDays.length; i += 7) {
    weeks.push(calendarDays.slice(i, i + 7));
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const getStatusColor = (status: string) => {
    const colors = {
      available: '#4CAF50',
      booked: '#F44336',
      pending: '#FFC107'
    };
    return colors[status] || '#9E9E9E';
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      available: 'Available',
      booked: 'Booked',
      pending: 'Pending'
    };
    return labels[status] || 'Unknown';
  };

  return (
    <div className="seasonal-calendar">
      <div className="calendar-header">
        <div className="header-left">
          <SeasonalIndicator season={season} size="md" />
          <h3 className="calendar-title">{monthNames[month - 1]} {year}</h3>
        </div>
        <div className="header-right">
          <button className="nav-button" onClick={() => {}}>←</button>
          <button className="nav-button" onClick={() => {}}>→</button>
        </div>
      </div>

      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="weekday">{day}</div>
        ))}
      </div>

      <div className="calendar-days">
        {weeks.map((week, weekIndex) => (
          <div key={weekIndex} className="calendar-week">
            {week.map((day, dayIndex) => {
              if (!day) return <div key={dayIndex} className="calendar-day empty"></div>;

              const isSelected = selectedDate === day.date;
              const statusColor = getStatusColor(day.status);

              return (
                <div
                  key={dayIndex}
                  className={`calendar-day ${day.status} ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedDate(day.date);
                    onDateClick?.(day.date);
                  }}
                  style={{ borderColor: statusColor }}
                >
                  <span className="day-number">{day.day}</span>
                  {day.price && <span className="day-price">€{day.price}</span>}
                  <span className="day-status" style={{ backgroundColor: statusColor }}>
                    {getStatusLabel(day.status).charAt(0)}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {selectedDate && (
        <div className="calendar-details">
          <div className="details-header">
            <span className="details-date">{selectedDate}</span>
            <button className="close-details" onClick={() => setSelectedDate(null)}>
              ✕
            </button>
          </div>
          <div className="details-content">
            <p>Status: {getStatusLabel(reservations.find(r => r.date === selectedDate)?.status || 'available')}</p>
            {reservations.find(r => r.date === selectedDate)?.price && (
              <p>Price: €{reservations.find(r => r.date === selectedDate)?.price}</p>
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .seasonal-calendar {
          background: white;
          border-radius: var(--tourism-radius-lg);
          box-shadow: var(--tourism-shadow-md);
          overflow: hidden;
          font-family: var(--tourism-font-primary);
        }

        .calendar-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--tourism-spacing-md);
          background: var(--tourism-light);
          border-bottom: 1px solid rgba(0, 119, 101, 0.1);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: var(--tourism-spacing-sm);
        }

        .calendar-title {
          font-size: 18px;
          font-weight: 600;
          color: var(--tourism-dark);
          margin: 0;
        }

        .header-right {
          display: flex;
          gap: var(--tourism-spacing-xs);
        }

        .nav-button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--tourism-primary);
          color: white;
          border: none;
          cursor: pointer;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          text-align: center;
          padding: var(--tourism-spacing-xs) 0;
          background: var(--tourism-light);
          border-bottom: 1px solid rgba(0, 119, 101, 0.1);
        }

        .weekday {
          font-size: 12px;
          font-weight: 500;
          color: var(--tourism-primary);
          padding: var(--tourism-spacing-xs) 0;
        }

        .calendar-days {
          display: flex;
          flex-direction: column;
        }

        .calendar-week {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
        }

        .calendar-day {
          aspect-ratio: 1;
          padding: var(--tourism-spacing-xs);
          border: 2px solid transparent;
          border-radius: var(--tourism-radius-sm);
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease;
          min-height: 60px;
        }

        .calendar-day:hover {
          background: rgba(0, 119, 101, 0.05);
          transform: scale(1.05);
        }

        .calendar-day.selected {
          background: rgba(0, 119, 101, 0.1);
          border-color: var(--tourism-primary) !important;
        }

        .calendar-day.empty {
          background: transparent;
          cursor: default;
        }

        .day-number {
          font-size: 14px;
          font-weight: 500;
          color: var(--tourism-dark);
        }

        .day-price {
          font-size: 10px;
          color: var(--tourism-primary);
          display: block;
          margin-top: 2px;
        }

        .day-status {
          position: absolute;
          bottom: 4px;
          right: 4px;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          color: white;
          font-size: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .calendar-details {
          padding: var(--tourism-spacing-md);
          background: var(--tourism-light);
          border-top: 1px solid rgba(0, 119, 101, 0.1);
        }

        .details-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tourism-spacing-sm);
        }

        .details-date {
          font-weight: 600;
          color: var(--tourism-primary);
        }

        .close-details {
          background: none;
          border: none;
          font-size: 16px;
          cursor: pointer;
          color: var(--tourism-primary);
          padding: 4px;
        }

        .details-content p {
          margin: var(--tourism-spacing-xs) 0;
          font-size: 14px;
          color: var(--tourism-dark);
        }

        @media (max-width: 640px) {
          .weekday {
            font-size: 10px;
            padding: 2px 0;
          }
          .day-number {
            font-size: 12px;
          }
          .day-price {
            font-size: 8px;
          }
        }
      `}</style>
    </div>
  );
};

// Availability Heatmap
export const AvailabilityHeatmap: React.FC<{
  season: 'summer' | 'winter' | 'spring' | 'autumn';
  availabilityData: Array<{
    month: number;
    year: number;
    availability: number; // 0-100
  }>;
}> = ({ season, availabilityData }) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const getAvailabilityColor = (availability: number) => {
    if (availability > 80) return '#4CAF50'; // High availability
    if (availability > 50) return '#FFC107'; // Medium availability
    if (availability > 20) return '#FF9800'; // Low availability
    return '#F44336'; // Very low availability
  };

  return (
    <div className="availability-heatmap">
      <h3 className="heatmap-title">
        <SeasonalIndicator season={season} size="sm" />
        {season.charAt(0).toUpperCase() + season.slice(1)} Availability
      </h3>

      <div className="heatmap-grid">
        {availabilityData.map((data, index) => (
          <div key={index} className="heatmap-month">
            <div className="month-label">{monthNames[data.month - 1]}</div>
            <div
              className="availability-bar"
              style={{
                height: `${data.availability}%`,
                backgroundColor: getAvailabilityColor(data.availability)
              }}
            >
              <span className="availability-percent">{data.availability}%</span>
            </div>
          </div>
        ))}
      </div>

      <div className="heatmap-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#4CAF50' }}></span>
          <span>High (>80%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#FFC107' }}></span>
          <span>Medium (50-80%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#FF9800' }}></span>
          <span>Low (20-50%)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#F44336' }}></span>
          <span>Very Low (<20%)</span>
        </div>
      </div>

      <style jsx>{`
        .availability-heatmap {
          background: white;
          border-radius: var(--tourism-radius-lg);
          box-shadow: var(--tourism-shadow-md);
          padding: var(--tourism-spacing-md);
        }

        .heatmap-title {
          display: flex;
          align-items: center;
          gap: var(--tourism-spacing-xs);
          color: var(--tourism-dark);
          font-size: 16px;
          font-weight: 600;
          margin-bottom: var(--tourism-spacing-md);
        }

        .heatmap-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
          gap: var(--tourism-spacing-sm);
          margin-bottom: var(--tourism-spacing-lg);
        }

        .heatmap-month {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--tourism-spacing-xs);
        }

        .month-label {
          font-size: 12px;
          color: var(--tourism-primary);
          font-weight: 500;
        }

        .availability-bar {
          width: 100%;
          border-radius: var(--tourism-radius-sm);
          position: relative;
          transition: height 0.3s ease;
          min-height: 20px;
        }

        .availability-percent {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          font-size: 10px;
          color: var(--tourism-dark);
          font-weight: 500;
        }

        .heatmap-legend {
          display: flex;
          flex-wrap: wrap;
          gap: var(--tourism-spacing-md);
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--tourism-spacing-xs);
          font-size: 12px;
          color: var(--tourism-dark);
        }

        .legend-color {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
      `}</style>
    </div>
  );
};

// Seasonal Pricing Calendar
export const SeasonalPricingCalendar: React.FC<{
  season: 'summer' | 'winter' | 'spring' | 'autumn';
  pricingData: Array<{
    month: number;
    year: number;
    basePrice: number;
    peakPrice: number;
    currentPrice: number;
  }>;
}> = ({ season, pricingData }) => {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return (
    <div className="pricing-calendar">
      <h3 className="pricing-title">
        <SeasonalIndicator season={season} size="sm" />
        {season.charAt(0).toUpperCase() + season.slice(1)} Pricing Trends
      </h3>

      <div className="pricing-chart">
        {pricingData.map((data, index) => {
          const priceHeight = (data.currentPrice / data.peakPrice) * 100;

          return (
            <div key={index} className="pricing-month">
              <div className="month-label">{monthNames[data.month - 1]}</div>
              <div className="pricing-bars">
                <div
                  className="base-price-bar"
                  style={{ height: `${(data.basePrice / data.peakPrice) * 100}%` }}
                ></div>
                <div
                  className="current-price-bar"
                  style={{ height: `${priceHeight}%` }}
                >
                  <span className="price-value">€{data.currentPrice}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pricing-legend">
        <div className="legend-item">
          <span className="legend-color base-price"></span>
          <span>Base Price</span>
        </div>
        <div className="legend-item">
          <span className="legend-color current-price"></span>
          <span>Current Price</span>
        </div>
      </div>

      <style jsx>{`
        .pricing-calendar {
          background: white;
          border-radius: var(--tourism-radius-lg);
          box-shadow: var(--tourism-shadow-md);
          padding: var(--tourism-spacing-md);
        }

        .pricing-title {
          display: flex;
          align-items: center;
          gap: var(--tourism-spacing-xs);
          color: var(--tourism-dark);
          font-size: 16px;
          font-weight: 600;
          margin-bottom: var(--tourism-spacing-md);
        }

        .pricing-chart {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
          gap: var(--tourism-spacing-sm);
          margin-bottom: var(--tourism-spacing-lg);
        }

        .pricing-month {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--tourism-spacing-xs);
        }

        .month-label {
          font-size: 12px;
          color: var(--tourism-primary);
          font-weight: 500;
        }

        .pricing-bars {
          position: relative;
          width: 100%;
          height: 120px;
        }

        .base-price-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: rgba(0, 119, 101, 0.2);
          border-radius: var(--tourism-radius-sm);
        }

        .current-price-bar {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(to top, var(--tourism-primary), var(--tourism-secondary));
          border-radius: var(--tourism-radius-sm);
          display: flex;
          align-items: flex-end;
          justify-content: center;
          padding-bottom: 4px;
        }

        .price-value {
          font-size: 10px;
          color: white;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0,0,0,0.3);
        }

        .pricing-legend {
          display: flex;
          gap: var(--tourism-spacing-lg);
          justify-content: center;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: var(--tourism-spacing-xs);
          font-size: 12px;
          color: var(--tourism-dark);
        }

        .legend-color {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        .base-price {
          background: rgba(0, 119, 101, 0.2);
        }

        .current-price {
          background: linear-gradient(to right, var(--tourism-primary), var(--tourism-secondary));
        }
      `}</style>
    </div>
  );
};
