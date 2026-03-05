import React from 'react';

export const TourismIcons = {
  Property: ({ size = 20, color = '#007765' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 10L12 3L21 10V20H14V14H10V20H3V10Z" fill={color}/>
      <path d="M14 14H21V20H14V14Z" fill={color} opacity="0.7"/>
    </svg>
  ),

  Reservation: ({ size = 20, color = '#FF8C42' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17 3H7C5.89543 3 5 3.89543 5 5V19C5 20.1046 5.89543 21 7 21H17C18.1046 21 19 20.1046 19 19V5C19 3.89543 18.1046 3 17 3Z" fill={color}/>
      <path d="M16 1H8C6.89543 1 6 1.89543 6 3V5H18V3C18 1.89543 17.1046 1 16 1Z" fill={color}/>
      <path d="M12 7V11" stroke="white" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 9H14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),

  Guest: ({ size = 20, color = '#4A90E2' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="6" r="4" fill={color}/>
      <path d="M20 18C20 14.6863 16.3137 12 12 12C7.68629 12 4 14.6863 4 18" stroke={color} strokeWidth="2"/>
    </svg>
  ),

  Itinerary: ({ size = 20, color = '#98FB98' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10H14V4H10V10H3L12 21L21 10Z" fill={color}/>
      <circle cx="8" cy="8" r="1" fill="white"/>
      <circle cx="16" cy="6" r="1" fill="white"/>
    </svg>
  ),

  Activity: ({ size = 20, color = '#FF7F50' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15 8H20L14 12L16 18L10 14L4 18L6 12L2 8H7L10 2L12 2Z" fill={color}/>
    </svg>
  ),

  Season: ({ season, size = 20 }) => {
    const seasonIcons = {
      summer: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="12" cy="12" r="6" fill="#FFD700"/>
                <path d="M12 1V3" stroke="#F57F17" strokeWidth="2" strokeLinecap="round"/>
                <path d="M12 21V23" stroke="#F57F17" strokeWidth="2" strokeLinecap="round"/>
                <path d="M3 12H1" stroke="#F57F17" strokeWidth="2" strokeLinecap="round"/>
                <path d="M21 12H23" stroke="#F57F17" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18.364 5.636L19.778 4.222" stroke="#F57F17" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5.636 18.364L4.222 19.778" stroke="#F57F17" strokeWidth="2" strokeLinecap="round"/>
                <path d="M18.364 18.364L19.778 19.778" stroke="#F57F17" strokeWidth="2" strokeLinecap="round"/>
                <path d="M5.636 5.636L4.222 4.222" stroke="#F57F17" strokeWidth="2" strokeLinecap="round"/>
              </svg>,
      winter: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14 8H20L15 12L16 18L12 15L8 18L9 12L4 8H10L12 2Z" fill="#ADD8E6"/>
                <path d="M12 14L10 16H14L12 14Z" fill="white"/>
              </svg>,
      spring: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C17.5228 2 22 6.47715 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2Z" fill="#98FB98"/>
                <path d="M12 6C14.2091 6 16 7.79086 16 10C16 12.2091 14.2091 14 12 14C9.79086 14 8 12.2091 8 10C8 7.79086 9.79086 6 12 6Z" fill="white"/>
                <path d="M12 10C13.1046 10 14 10.8954 14 12C14 13.1046 13.1046 14 12 14C10.8954 14 10 13.1046 10 12C10 10.8954 10.8954 10 12 10Z" fill="#98FB98"/>
              </svg>,
      autumn: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L14 8H20L15 12L16 18L12 15L8 18L9 12L4 8H10L12 2Z" fill="#FF7F50"/>
                <circle cx="8" cy="8" r="1" fill="#FF8C00"/>
                <circle cx="16" cy="6" r="1" fill="#FF8C00"/>
                <circle cx="12" cy="14" r="1" fill="#FF8C00"/>
              </svg>
    };
    return seasonIcons[season] || seasonIcons.summer;
  },

  Pricing: ({ size = 20, color = '#FFD700' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C13.1046 2 14 2.89543 14 4C14 5.10457 13.1046 6 12 6C10.8954 6 10 5.10457 10 4C10 2.89543 10.8954 2 12 2Z" fill={color}/>
      <path d="M12 8C14.2091 8 16 9.79086 16 12C16 14.2091 14.2091 16 12 16C9.79086 16 8 14.2091 8 12C8 9.79086 9.79086 8 12 8Z" fill={color}/>
      <path d="M12 18C14.2091 18 16 19.7909 16 22C16 24.2091 14.2091 26 12 26C9.79086 26 8 24.2091 8 22C8 19.7909 9.79086 18 12 18Z" fill={color}/>
      <path d="M2 12H22" stroke={color} strokeWidth="2"/>
    </svg>
  ),

  Review: ({ size = 20, color = '#FFD700' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 17.27L18.18 21L16.54 13.97L22 9.24L14.81 8.63L12 2L9.19 8.63L2 9.24L7.46 13.97L5.82 21L12 17.27Z" fill={color}/>
    </svg>
  ),

  Location: ({ size = 20, color = '#FF5722' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C8.13 2 5 5.13 5 9C5 14.25 12 22 12 22C12 22 19 14.25 19 9C19 5.13 15.87 2 12 2Z" fill={color}/>
      <circle cx="12" cy="9" r="3" fill="white"/>
    </svg>
  ),

  Amenity: ({ type, size = 20 }) => {
    const amenityIcons = {
      wifi: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 3C8.5 6.67 8.5 11.33 12 15" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 15C15.5 11.33 15.5 6.67 12 3" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 15C9.5 18.67 9.5 21.33 12 24" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
              <path d="M12 21C14.5 18.67 14.5 15.33 12 12" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round"/>
            </svg>,
      pool: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="2" y="6" width="20" height="12" rx="2" fill="#2196F3"/>
              <path d="M4 8H20" stroke="white" strokeWidth="2"/>
              <path d="M8 12H16" stroke="white" strokeWidth="2"/>
            </svg>,
      parking: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 2H6C4.89543 2 4 2.89543 4 4V16C4 17.1046 4.89543 18 6 18H18C19.1046 18 20 17.1046 20 16V4C20 2.89543 19.1046 2 18 2Z" fill="#607D8B"/>
              <circle cx="8" cy="10" r="2" fill="white"/>
              <circle cx="16" cy="10" r="2" fill="white"/>
            </svg>,
      breakfast: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 18H20V20H4V18Z" fill="#FFC107"/>
              <path d="M7 15H17V17H7V15Z" fill="#FFC107"/>
              <path d="M9 12H15V14H9V12Z" fill="#FFC107"/>
              <path d="M6 9H18V11H6V9Z" fill="#FFC107"/>
              <path d="M5 6H19V8H5V6Z" fill="#FFC107"/>
            </svg>,
      spa: <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L12 6" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 6L16 6" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 10L18 10" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round"/>
              <path d="M4 14L20 14" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round"/>
              <path d="M6 18L18 18" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round"/>
              <path d="M8 22L16 22" stroke="#9C27B0" strokeWidth="2" strokeLinecap="round"/>
            </svg>
    };
    return amenityIcons[type] || amenityIcons.wifi;
  }
};

export const TourismIcon = ({ name, ...props }: { name: keyof typeof TourismIcons, [key: string]: any }) => {
  const IconComponent = TourismIcons[name];
  return IconComponent ? <IconComponent {...props} /> : null;
};

export default TourismIcons;
