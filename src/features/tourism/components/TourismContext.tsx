import React from 'react';
import { TourismIcons } from './TourismIcons';

export interface TourismContextProps {
  location: string;
  season: 'summer' | 'winter' | 'spring' | 'autumn';
  propertyType?: 'hotel' | 'apartment' | 'villa' | 'camping' | 'hostel';
  showIcon?: boolean;
  className?: string;
}

export const TourismContext: React.FC<TourismContextProps> = ({
  location,
  season,
  propertyType = 'hotel',
  showIcon = true,
  className = ''
}) => {
  const seasonData = {
    summer: {
      icon: "☀️",
      colors: ["#FFD700", "#FFA500"],
      label: "Summer Season",
      period: "June - August"
    },
    winter: {
      icon: "❄️",
      colors: ["#ADD8E6", "#B0E0E6"],
      label: "Winter Season",
      period: "December - February"
    },
    spring: {
      icon: "🌸",
      colors: ["#98FB98", "#90EE90"],
      label: "Spring Season",
      period: "March - May"
    },
    autumn: {
      icon: "🍁",
      colors: ["#FF7F50", "#FF8C00"],
      label: "Autumn Season",
      period: "September - November"
    }
  };

  const propertyIcons = {
    hotel: "🏨",
    apartment: "🏢",
    villa: "🏠",
    camping: "⛺",
    hostel: "🏘️"
  };

  const currentSeason = seasonData[season];

  return (
    <div className={`tourism-context ${className}`}>
      <div
        className="season-badge"
        style={{
          background: `linear-gradient(135deg, ${currentSeason.colors.join(', ')})`
        }}
      >
        {showIcon && (
          <>
            <span className="season-icon">{currentSeason.icon}</span>
            <span className="season-period">{currentSeason.period}</span>
          </>
        )}
      </div>

      <div className="location-info">
        <div className="location-name">
          <TourismIcons.Location size={16} color="#FF5722" />
          <span>{location}</span>
        </div>

        <div className="property-type">
          <span className="property-icon">{propertyIcons[propertyType]}</span>
          <span>{propertyType.charAt(0).toUpperCase() + propertyType.slice(1)}</span>
        </div>
      </div>

      <style jsx>{`
        .tourism-context {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: white;
          padding: 4px 8px;
          border-radius: 20px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          font-size: 14px;
        }

        .season-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 12px;
          border-radius: 16px;
          color: white;
          font-weight: 600;
          font-size: 12px;
          text-shadow: 0 1px 1px rgba(0,0,0,0.2);
        }

        .season-icon {
          font-size: 16px;
        }

        .season-period {
          font-size: 10px;
          opacity: 0.9;
        }

        .location-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .location-name, .property-type {
          display: flex;
          align-items: center;
          gap: 4px;
          color: var(--tourism-dark);
          font-size: 13px;
        }

        .property-icon {
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .tourism-context {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

// Seasonal Context Indicator
export const SeasonalIndicator: React.FC<{
  season: 'summer' | 'winter' | 'spring' | 'autumn';
  size?: 'sm' | 'md' | 'lg';
}> = ({ season, size = 'md' }) => {
  const seasonData = {
    summer: { icon: "☀️", color: "#FFD700", label: "Summer" },
    winter: { icon: "❄️", color: "#ADD8E6", label: "Winter" },
    spring: { icon: "🌸", color: "#98FB98", label: "Spring" },
    autumn: { icon: "🍁", color: "#FF7F50", label: "Autumn" }
  };

  const current = seasonData[season];
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base"
  };

  return (
    <span
      className={`seasonal-indicator ${sizeClasses[size]}`}
      style={{
        backgroundColor: current.color,
        color: season === 'autumn' ? 'white' : 'var(--tourism-dark)',
        borderRadius: '16px',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px'
      }}
    >
      <span>{current.icon}</span>
      <span>{current.label}</span>
    </span>
  );
};

// Property Type Badge
export const PropertyTypeBadge: React.FC<{
  type: 'hotel' | 'apartment' | 'villa' | 'camping' | 'hostel';
  size?: 'sm' | 'md';
}> = ({ type, size = 'md' }) => {
  const typeData = {
    hotel: { icon: "🏨", label: "Hotel", color: "#007765" },
    apartment: { icon: "🏢", label: "Apartment", color: "#4A90E2" },
    villa: { icon: "🏠", label: "Villa", color: "#98FB98" },
    camping: { icon: "⛺", label: "Camping", color: "#FF7F50" },
    hostel: { icon: "🏘️", label: "Hostel", color: "#FF8C42" }
  };

  const current = typeData[type];
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm"
  };

  return (
    <span
      className={`property-type-badge ${sizeClasses[size]}`}
      style={{
        backgroundColor: current.color + "20",
        color: current.color,
        borderRadius: '12px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        border: `1px solid ${current.color}30`
      }}
    >
      <span>{current.icon}</span>
      <span>{current.label}</span>
    </span>
  );
};

// Occupancy Status Indicator
export const OccupancyStatus: React.FC<{
  status: 'available' | 'booked' | 'pending' | 'maintenance';
  size?: 'sm' | 'md';
}> = ({ status, size = 'md' }) => {
  const statusData = {
    available: { label: "Available", color: "#4CAF50", icon: "✓" },
    booked: { label: "Booked", color: "#F44336", icon: "✗" },
    pending: { label: "Pending", color: "#FFC107", icon: "⏳" },
    maintenance: { label: "Maintenance", color: "#9E9E9E", icon: "🔧" }
  };

  const current = statusData[status];
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm"
  };

  return (
    <span
      className={`occupancy-status ${sizeClasses[size]}`}
      style={{
        backgroundColor: current.color + "20",
        color: current.color,
        borderRadius: '12px',
        fontWeight: '500',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        border: `1px solid ${current.color}30`
      }}
    >
      <span>{current.icon}</span>
      <span>{current.label}</span>
    </span>
  );
};

// Feature Badge Component
interface FeatureBadgeProps {
  feature: 'wifi' | 'pool' | 'parking' | 'breakfast' | 'spa' | 'gym' | 'pets';
  size?: 'sm' | 'md';
}

export const FeatureBadge: React.FC<FeatureBadgeProps> = ({ feature, size = 'md' }) => {
  const featureData = {
    wifi: { label: "WiFi", color: "#4CAF50" },
    pool: { label: "Pool", color: "#2196F3" },
    parking: { label: "Parking", color: "#607D8B" },
    breakfast: { label: "Breakfast", color: "#FFC107" },
    spa: { label: "Spa", color: "#9C27B0" },
    gym: { label: "Gym", color: "#FF5722" },
    pets: { label: "Pet Friendly", color: "#795548" }
  };

  const current = featureData[feature];
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-8 h-8"
  };

  return (
    <div
      className={`feature-badge ${sizeClasses[size]}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        backgroundColor: current.color + "20",
        border: `1px solid ${current.color}`,
        position: 'relative'
      }}
    >
      <TourismIcons.Amenity type={feature} size={size === 'sm' ? 16 : 20} />
      <span className="feature-tooltip">
        {current.label}
      </span>
      <style jsx>{`
        .feature-badge:hover .feature-tooltip {
          opacity: 1;
          visibility: visible;
        }
        .feature-tooltip {
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          opacity: 0;
          visibility: hidden;
          transition: all 0.2s ease;
          margin-bottom: 4px;
        }
        .feature-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 4px solid transparent;
          border-top-color: rgba(0, 0, 0, 0.8);
        }
      `}</style>
    </div>
  );
};
