import React from 'react';
import { logger } from '@/infrastructure/observability/logger';
import Image from 'next/image';
import { TourismContext, SeasonalIndicator, PropertyTypeBadge, OccupancyStatus, FeatureBadge } from './TourismContext';
import { TourismIcons } from './TourismIcons';

export interface PropertyCardProps {
  property: {
    id: string;
    name: string;
    location: string;
    type: 'hotel' | 'apartment' | 'villa' | 'camping' | 'hostel';
    price: number;
    rating: number;
    reviews: number;
    features: ('wifi' | 'pool' | 'parking' | 'breakfast' | 'spa' | 'gym' | 'pets')[];
    imageUrl: string;
    season: 'summer' | 'winter' | 'spring' | 'autumn';
    occupancyStatus: 'available' | 'booked' | 'pending' | 'maintenance';
    description: string;
  };
  onClick?: () => void;
  showSeasonal?: boolean;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onClick, showSeasonal = true }) => {
  const getSeasonalImage = (type: string, season: string) => {
    const seasonalImages = {
      hotel: {
        summer: "/images/properties/hotel-summer.jpg",
        winter: "/images/properties/hotel-winter.jpg"
      },
      apartment: {
        summer: "/images/properties/apartment-summer.jpg",
        winter: "/images/properties/apartment-winter.jpg"
      },
      villa: {
        summer: "/images/properties/villa-summer.jpg",
        winter: "/images/properties/villa-winter.jpg"
      },
      camping: {
        summer: "/images/properties/camping-summer.jpg",
        winter: "/images/properties/camping-winter.jpg"
      },
      hostel: {
        summer: "/images/properties/hostel-summer.jpg",
        winter: "/images/properties/hostel-winter.jpg"
      }
    };
    return seasonalImages[type]?.[season] || "/images/properties/default.jpg";
  };

  return (
    <div className="property-card" onClick={onClick}>
      <div className="property-image">
        <Image
          src={getSeasonalImage(property.type, property.season)}
          alt={property.name}
          fill
          className="property-img"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />

        {showSeasonal && (
          <div className="seasonal-badge">
            <SeasonalIndicator season={property.season} size="sm" />
          </div>
        )}

        <div className="property-actions">
          <button className="action-button favorite">
            <TourismIcons.Property size={16} color="white" />
          </button>
          <button className="action-button share">
            <span>📤</span>
          </button>
        </div>
      </div>

      <div className="property-info">
        <div className="property-header">
          <h3 className="property-name">{property.name}</h3>
          <div className="property-rating">
            <span>⭐ {property.rating}</span>
            <span className="review-count">({property.reviews})</span>
          </div>
        </div>

        <TourismContext
          location={property.location}
          season={property.season}
          propertyType={property.type}
        />

        <div className="property-features">
          {property.features.slice(0, 4).map(feature => (
            <FeatureBadge key={feature} feature={feature} size="sm" />
          ))}
          {property.features.length > 4 && (
            <span className="more-features">+{property.features.length - 4}</span>
          )}
        </div>

        <div className="property-footer">
          <div className="property-price">
            <span className="price-amount">€{property.price}</span>
            <span className="price-period">/night</span>
          </div>

          <OccupancyStatus
            status={property.occupancyStatus}
            size="sm"
          />
        </div>
      </div>

      <style jsx>{`
        .property-card {
          background: white;
          border-radius: var(--tourism-radius-lg);
          overflow: hidden;
          box-shadow: var(--tourism-shadow-md);
          transition: all 0.3s ease;
          cursor: pointer;
          border: 1px solid rgba(0, 119, 101, 0.1);
        }

        .property-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--tourism-shadow-lg);
          border-color: rgba(0, 119, 101, 0.2);
        }

        .property-image {
          position: relative;
          height: 200px;
          overflow: hidden;
        }

        .property-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.3s ease;
        }

        .property-card:hover .property-img {
          transform: scale(1.05);
        }

        .seasonal-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          z-index: 10;
        }

        .property-actions {
          position: absolute;
          top: 12px;
          right: 12px;
          display: flex;
          gap: 8px;
          z-index: 10;
        }

        .action-button {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.5);
          border: none;
          color: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .action-button:hover {
          background: rgba(0, 119, 101, 0.7);
          transform: scale(1.1);
        }

        .property-info {
          padding: var(--tourism-spacing-md);
        }

        .property-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tourism-spacing-sm);
        }

        .property-name {
          font-family: var(--tourism-font-secondary);
          font-size: 18px;
          font-weight: 600;
          color: var(--tourism-dark);
          margin: 0;
        }

        .property-rating {
          display: flex;
          align-items: center;
          gap: 4px;
          background: var(--tourism-light);
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 14px;
          color: var(--tourism-primary);
        }

        .review-count {
          color: var(--tourism-primary);
          opacity: 0.7;
          font-size: 12px;
        }

        .property-features {
          display: flex;
          gap: 8px;
          margin: var(--tourism-spacing-sm) 0;
          flex-wrap: wrap;
        }

        .more-features {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--tourism-light);
          color: var(--tourism-primary);
          font-size: 12px;
          border: 1px solid rgba(0, 119, 101, 0.2);
        }

        .property-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: var(--tourism-spacing-sm);
        }

        .property-price {
          display: flex;
          align-items: baseline;
          gap: 4px;
        }

        .price-amount {
          font-family: var(--tourism-font-secondary);
          font-size: 18px;
          font-weight: 600;
          color: var(--tourism-primary);
        }

        .price-period {
          font-size: 12px;
          color: var(--tourism-primary);
          opacity: 0.7;
        }

        @media (max-width: 768px) {
          .property-image {
            height: 160px;
          }
        }
      `}</style>
    </div>
  );
};

// Property Grid Component
export const PropertyGrid: React.FC<{
  properties: PropertyCardProps['property'][];
  onPropertyClick?: (propertyId: string) => void;
}> = ({ properties, onPropertyClick }) => {
  return (
    <div className="property-grid">
      {properties.map(property => (
        <PropertyCard
          key={property.id}
          property={property}
          onClick={() => onPropertyClick?.(property.id)}
        />
      ))}

      <style jsx>{`
        .property-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--tourism-spacing-lg);
          margin: var(--tourism-spacing-lg) 0;
        }

        @media (max-width: 1024px) {
          .property-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .property-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

// Seasonal Property Showcase
export const SeasonalShowcase: React.FC<{
  season: 'summer' | 'winter' | 'spring' | 'autumn';
  properties: PropertyCardProps['property'][];
  title?: string;
}> = ({ season, properties, title = "Seasonal Highlights" }) => {
  const seasonData = {
    summer: {
      gradient: "linear-gradient(135deg, #FFD700, #FFA500)",
      icon: "☀️"
    },
    winter: {
      gradient: "linear-gradient(135deg, #ADD8E6, #B0E0E6)",
      icon: "❄️"
    },
    spring: {
      gradient: "linear-gradient(135deg, #98FB98, #90EE90)",
      icon: "🌸"
    },
    autumn: {
      gradient: "linear-gradient(135deg, #FF7F50, #FF8C00)",
      icon: "🍁"
    }
  };

  const currentSeason = seasonData[season];

  return (
    <div className="seasonal-showcase">
      <div
        className="showcase-header"
        style={{ background: currentSeason.gradient }}
      >
        <h2 className="showcase-title">
          {currentSeason.icon} {title}
        </h2>
      </div>

      <PropertyGrid
        properties={properties}
        onPropertyClick={(id) => logger.info(`Property clicked: ${id}`)}
      />

      <style jsx>{`
        .seasonal-showcase {
          border-radius: var(--tourism-radius-lg);
          overflow: hidden;
          background: white;
          box-shadow: var(--tourism-shadow-md);
        }

        .showcase-header {
          padding: var(--tourism-spacing-lg);
          color: white;
          text-shadow: 0 1px 2px rgba(0,0,0,0.2);
        }

        .showcase-title {
          font-family: var(--tourism-font-secondary);
          font-size: 24px;
          font-weight: 600;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }
      `}</style>
    </div>
  );
};

// Property Detail View
export const PropertyDetail: React.FC<{
  property: PropertyCardProps['property'];
  onClose: () => void;
}> = ({ property, onClose }) => {
  return (
    <div className="property-detail-overlay">
      <div className="property-detail-card">
        <button className="close-button" onClick={onClose}>
          ✕
        </button>

        <div className="detail-image">
          <Image
            src={property.imageUrl}
            alt={property.name}
            fill
            className="detail-img"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
          <SeasonalIndicator season={property.season} size="lg" />
        </div>

        <div className="detail-info">
          <div className="detail-header">
            <h2 className="detail-name">{property.name}</h2>
            <div className="detail-rating">
              <span>⭐ {property.rating}</span>
              <span className="detail-reviews">({property.reviews} reviews)</span>
            </div>
          </div>

          <TourismContext
            location={property.location}
            season={property.season}
            propertyType={property.type}
            className="detail-context"
          />

          <div className="detail-description">
            <p>{property.description}</p>
          </div>

          <div className="detail-features">
            <h4>Features & Amenities</h4>
            <div className="features-grid">
              {property.features.map(feature => (
                <div key={feature} className="feature-item">
                  <FeatureBadge feature={feature} size="md" />
                  <span>{feature.charAt(0).toUpperCase() + feature.slice(1)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="detail-footer">
            <div className="detail-price">
              <span className="price-label">Price per night</span>
              <span className="price-amount">€{property.price}</span>
            </div>

            <button className="btn-tourism btn-tourism-primary">
              Book Now
            </button>
          </div>
        </div>

        <style jsx>{`
          .property-detail-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 20px;
          }

          .property-detail-card {
            background: white;
            border-radius: var(--tourism-radius-lg);
            max-width: 800px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
            position: relative;
            box-shadow: var(--tourism-shadow-xl);
          }

          .close-button {
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: var(--tourism-light);
            border: none;
            font-size: 18px;
            cursor: pointer;
            z-index: 10;
          }

          .detail-image {
            height: 300px;
            position: relative;
            overflow: hidden;
          }

          .detail-img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .detail-info {
            padding: var(--tourism-spacing-lg);
          }

          .detail-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--tourism-spacing-sm);
          }

          .detail-name {
            font-family: var(--tourism-font-secondary);
            font-size: 24px;
            font-weight: 600;
            color: var(--tourism-dark);
            margin: 0;
          }

          .detail-rating {
            background: var(--tourism-light);
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 16px;
            color: var(--tourism-primary);
          }

          .detail-reviews {
            font-size: 14px;
            opacity: 0.7;
            margin-left: 4px;
          }

          .detail-context {
            margin: var(--tourism-spacing-sm) 0;
          }

          .detail-description {
            margin: var(--tourism-spacing-md) 0;
            color: var(--tourism-dark);
            line-height: 1.6;
          }

          .detail-features {
            margin: var(--tourism-spacing-md) 0;
          }

          .detail-features h4 {
            color: var(--tourism-primary);
            margin-bottom: var(--tourism-spacing-sm);
          }

          .features-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: var(--tourism-spacing-sm);
          }

          .feature-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
            color: var(--tourism-dark);
          }

          .detail-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: var(--tourism-spacing-lg);
            padding-top: var(--tourism-spacing-md);
            border-top: 1px solid var(--tourism-light);
          }

          .detail-price {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
          }

          .price-label {
            font-size: 12px;
            color: var(--tourism-primary);
            opacity: 0.7;
          }

          .price-amount {
            font-family: var(--tourism-font-secondary);
            font-size: 24px;
            font-weight: 600;
            color: var(--tourism-primary);
          }

          @media (max-width: 768px) {
            .property-detail-card {
              max-height: 95vh;
            }
            .features-grid {
              grid-template-columns: repeat(2, 1fr);
            }
            .detail-footer {
              flex-direction: column;
              gap: var(--tourism-spacing-md);
              align-items: stretch;
            }
            .btn-tourism {
              width: 100%;
            }
          }
        `}</style>
      </div>
    </div>
  );
};
