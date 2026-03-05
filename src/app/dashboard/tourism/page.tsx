"use client";

import React, { useState } from "react";
import {
  PropertyCard,
  PropertyGrid,
  SeasonalShowcase,
  PropertyDetail,
} from "@/components/tourism/PropertyCard";
import {
  SeasonalCalendar,
  AvailabilityHeatmap,
  SeasonalPricingCalendar,
} from "@/components/tourism/SeasonalCalendar";
import {
  TourismContext,
  SeasonalIndicator,
} from "@/components/tourism/TourismContext";
import Link from "next/link";

// Mock data for demonstration
const mockProperties = [
  {
    id: "1",
    name: "Sunset Beach Resort",
    location: "Bled, Slovenia",
    type: "hotel",
    price: 180,
    rating: 4.8,
    reviews: 245,
    features: ["wifi", "pool", "breakfast", "spa", "gym"],
    imageUrl: "/images/properties/hotel-summer.jpg",
    season: "summer",
    occupancyStatus: "available",
    description:
      "Luxurious beachfront resort with stunning sunset views, infinity pool, and world-class spa facilities.",
  },
  {
    id: "2",
    name: "Alpine Chalet",
    location: "Kranjska Gora, Slovenia",
    type: "villa",
    price: 250,
    rating: 4.9,
    reviews: 187,
    features: ["wifi", "pool", "parking", "breakfast"],
    imageUrl: "/images/properties/villa-winter.jpg",
    season: "winter",
    occupancyStatus: "booked",
    description:
      "Cozy alpine chalet with fireplace, private hot tub, and breathtaking mountain views.",
  },
  {
    id: "3",
    name: "City Center Apartments",
    location: "Ljubljana, Slovenia",
    type: "apartment",
    price: 120,
    rating: 4.6,
    reviews: 312,
    features: ["wifi", "parking", "breakfast"],
    imageUrl: "/images/properties/apartment-summer.jpg",
    season: "summer",
    occupancyStatus: "available",
    description:
      "Modern apartments in the heart of Ljubljana with easy access to all major attractions.",
  },
  {
    id: "4",
    name: "Lake View Camping",
    location: "Bohinj, Slovenia",
    type: "camping",
    price: 65,
    rating: 4.7,
    reviews: 198,
    features: ["wifi", "parking", "pets"],
    imageUrl: "/images/properties/camping-summer.jpg",
    season: "summer",
    occupancyStatus: "pending",
    description:
      "Eco-friendly camping site with direct lake access and stunning alpine views.",
  },
];

const mockReservations = [
  { date: "2023-07-15", status: "booked", price: 180 },
  { date: "2023-07-16", status: "booked", price: 180 },
  { date: "2023-07-20", status: "pending", price: 180 },
  { date: "2023-07-25", status: "available", price: 200 },
];

const mockAvailability = [
  { month: 6, year: 2023, availability: 95 },
  { month: 7, year: 2023, availability: 85 },
  { month: 8, year: 2023, availability: 75 },
  { month: 9, year: 2023, availability: 65 },
];

const mockPricing = [
  { month: 6, year: 2023, basePrice: 150, peakPrice: 220, currentPrice: 180 },
  { month: 7, year: 2023, basePrice: 160, peakPrice: 240, currentPrice: 200 },
  { month: 8, year: 2023, basePrice: 170, peakPrice: 260, currentPrice: 220 },
  { month: 9, year: 2023, basePrice: 140, peakPrice: 200, currentPrice: 160 },
];

export default function TourismDashboard() {
  const [selectedProperty, setSelectedProperty] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "properties" | "calendar" | "analytics"
  >("properties");

  const selectedPropertyData = mockProperties.find(
    (p) => p.id === selectedProperty,
  );

  return (
    <div className="tourism-dashboard">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h1 className="dashboard-title">🌍 Tourism Management</h1>
          <TourismContext
            location="Slovenia"
            season="summer"
            propertyType="hotel"
          />
        </div>
        <div className="header-right">
          <Link href="/dashboard" className="btn-tourism btn-tourism-secondary">
            ← Back to Dashboard
          </Link>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="dashboard-tabs">
        <button
          className={`tab-button ${activeTab === "properties" ? "active" : ""}`}
          onClick={() => setActiveTab("properties")}
        >
          <span>🏨 Properties</span>
        </button>
        <button
          className={`tab-button ${activeTab === "calendar" ? "active" : ""}`}
          onClick={() => setActiveTab("calendar")}
        >
          <span>📅 Calendar</span>
        </button>
        <button
          className={`tab-button ${activeTab === "analytics" ? "active" : ""}`}
          onClick={() => setActiveTab("analytics")}
        >
          <span>📊 Analytics</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === "properties" && (
          <div className="properties-tab">
            {/* Seasonal Showcase */}
            <SeasonalShowcase
              season="summer"
              properties={mockProperties.filter((p) => p.season === "summer")}
              title="🌞 Summer Highlights"
            />

            {/* All Properties */}
            <div className="section-header">
              <h2>All Properties</h2>
              <div className="section-actions">
                <button className="btn-tourism btn-tourism-primary">
                  + Add Property
                </button>
              </div>
            </div>

            <PropertyGrid
              properties={mockProperties}
              onPropertyClick={setSelectedProperty}
            />
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="calendar-tab">
            <div className="calendar-grid">
              <div className="calendar-section">
                <SeasonalCalendar
                  season="summer"
                  year={2023}
                  month={7}
                  reservations={mockReservations}
                />
              </div>
              <div className="analytics-section">
                <AvailabilityHeatmap
                  season="summer"
                  availabilityData={mockAvailability}
                />
                <SeasonalPricingCalendar
                  season="summer"
                  pricingData={mockPricing}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="analytics-tab">
            <div className="analytics-grid">
              {/* Seasonal Performance */}
              <div className="analytics-card">
                <h3>📈 Seasonal Performance</h3>
                <div className="performance-metrics">
                  <div className="metric">
                    <span className="metric-value">85%</span>
                    <span className="metric-label">Occupancy Rate</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">€180</span>
                    <span className="metric-label">Avg. Daily Rate</span>
                  </div>
                  <div className="metric">
                    <span className="metric-value">4.7</span>
                    <span className="metric-label">Guest Rating</span>
                  </div>
                </div>
              </div>

              {/* Revenue Overview */}
              <div className="analytics-card">
                <h3>💰 Revenue Overview</h3>
                <div className="revenue-chart">
                  <div className="revenue-bar" style={{ height: "75%" }}>
                    <span className="revenue-value">€45,200</span>
                    <span className="revenue-month">July</span>
                  </div>
                  <div className="revenue-bar" style={{ height: "65%" }}>
                    <span className="revenue-value">€38,900</span>
                    <span className="revenue-month">June</span>
                  </div>
                  <div className="revenue-bar" style={{ height: "85%" }}>
                    <span className="revenue-value">€51,300</span>
                    <span className="revenue-month">August</span>
                  </div>
                </div>
              </div>

              {/* Guest Demographics */}
              <div className="analytics-card">
                <h3>👥 Guest Demographics</h3>
                <div className="demographics-chart">
                  <div className="demo-section">
                    <h4>Nationalities</h4>
                    <div className="demo-item">
                      <span
                        className="demo-color"
                        style={{ backgroundColor: "#4CAF50" }}
                      ></span>
                      <span>Slovenia - 35%</span>
                    </div>
                    <div className="demo-item">
                      <span
                        className="demo-color"
                        style={{ backgroundColor: "#2196F3" }}
                      ></span>
                      <span>Germany - 25%</span>
                    </div>
                    <div className="demo-item">
                      <span
                        className="demo-color"
                        style={{ backgroundColor: "#FFC107" }}
                      ></span>
                      <span>Italy - 15%</span>
                    </div>
                  </div>
                  <div className="demo-section">
                    <h4>Age Groups</h4>
                    <div className="demo-item">
                      <span
                        className="demo-color"
                        style={{ backgroundColor: "#9C27B0" }}
                      ></span>
                      <span>25-34 - 40%</span>
                    </div>
                    <div className="demo-item">
                      <span
                        className="demo-color"
                        style={{ backgroundColor: "#FF5722" }}
                      ></span>
                      <span>35-44 - 30%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Property Detail Modal */}
      {selectedProperty && selectedPropertyData && (
        <PropertyDetail
          property={selectedPropertyData}
          onClose={() => setSelectedProperty(null)}
        />
      )}

      <style jsx>{`
        .tourism-dashboard {
          max-width: 1400px;
          margin: 0 auto;
          padding: var(--tourism-spacing-lg);
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--tourism-spacing-lg);
        }

        .header-left {
          display: flex;
          flex-direction: column;
          gap: var(--tourism-spacing-sm);
        }

        .dashboard-title {
          font-family: var(--tourism-font-secondary);
          font-size: 28px;
          font-weight: 600;
          color: var(--tourism-dark);
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .dashboard-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: var(--tourism-spacing-lg);
          border-bottom: 1px solid var(--tourism-light);
        }

        .tab-button {
          padding: var(--tourism-spacing-sm) var(--tourism-spacing-md);
          background: transparent;
          border: none;
          font-size: 14px;
          font-weight: 500;
          color: var(--tourism-primary);
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .tab-button:hover {
          color: var(--tourism-dark);
        }

        .tab-button.active {
          color: var(--tourism-dark);
          border-bottom: 2px solid var(--tourism-primary);
        }

        .tab-button.active::after {
          content: "";
          position: absolute;
          bottom: -1px;
          left: 0;
          right: 0;
          height: 2px;
          background: var(--tourism-primary);
        }

        .tab-content {
          min-height: 600px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin: var(--tourism-spacing-lg) 0;
        }

        .section-header h2 {
          font-family: var(--tourism-font-secondary);
          font-size: 20px;
          font-weight: 600;
          color: var(--tourism-dark);
          margin: 0;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: 1fr 300px;
          gap: var(--tourism-spacing-lg);
        }

        .calendar-section {
          background: white;
          border-radius: var(--tourism-radius-lg);
          box-shadow: var(--tourism-shadow-md);
          padding: var(--tourism-spacing-md);
        }

        .analytics-section {
          display: flex;
          flex-direction: column;
          gap: var(--tourism-spacing-lg);
        }

        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--tourism-spacing-lg);
        }

        .analytics-card {
          background: white;
          border-radius: var(--tourism-radius-lg);
          box-shadow: var(--tourism-shadow-md);
          padding: var(--tourism-spacing-md);
        }

        .analytics-card h3 {
          color: var(--tourism-primary);
          font-size: 16px;
          font-weight: 600;
          margin-bottom: var(--tourism-spacing-md);
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .performance-metrics {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--tourism-spacing-md);
        }

        .metric {
          text-align: center;
        }

        .metric-value {
          font-family: var(--tourism-font-secondary);
          font-size: 24px;
          font-weight: 600;
          color: var(--tourism-primary);
          display: block;
        }

        .metric-label {
          font-size: 12px;
          color: var(--tourism-dark);
          opacity: 0.7;
        }

        .revenue-chart {
          display: flex;
          align-items: flex-end;
          gap: var(--tourism-spacing-sm);
          height: 200px;
          margin-top: var(--tourism-spacing-md);
        }

        .revenue-bar {
          flex: 1;
          background: linear-gradient(
            to top,
            var(--tourism-primary),
            var(--tourism-secondary)
          );
          border-radius: var(--tourism-radius-sm);
          position: relative;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: var(--tourism-spacing-xs);
        }

        .revenue-value {
          font-size: 12px;
          color: white;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .revenue-month {
          font-size: 10px;
          color: rgba(255, 255, 255, 0.8);
          margin-top: 2px;
        }

        .demographics-chart {
          display: flex;
          gap: var(--tourism-spacing-lg);
          margin-top: var(--tourism-spacing-md);
        }

        .demo-section {
          flex: 1;
        }

        .demo-section h4 {
          font-size: 14px;
          color: var(--tourism-primary);
          margin-bottom: var(--tourism-spacing-xs);
        }

        .demo-item {
          display: flex;
          align-items: center;
          gap: var(--tourism-spacing-xs);
          font-size: 12px;
          margin: var(--tourism-spacing-xs) 0;
        }

        .demo-color {
          display: inline-block;
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }

        @media (max-width: 1024px) {
          .calendar-grid {
            grid-template-columns: 1fr;
          }
          .analytics-grid {
            grid-template-columns: 1fr;
          }
        }

        @media (max-width: 768px) {
          .dashboard-header {
            flex-direction: column;
            gap: var(--tourism-spacing-md);
            align-items: flex-start;
          }
          .dashboard-tabs {
            overflow-x: auto;
            padding-bottom: var(--tourism-spacing-sm);
          }
        }
      `}</style>
    </div>
  );
}
