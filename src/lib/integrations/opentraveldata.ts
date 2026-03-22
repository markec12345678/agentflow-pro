/**
 * OpenTravelData Integration for AgentFlow Pro
 * 
 * Provides access to 50,000+ verified tourism POIs:
 * - Attractions (museums, parks, castles, beaches)
 * - Airports (IATA codes, locations)
 * - Transport options
 * 
 * Data source: https://github.com/opentraveldata/opentraveldata
 * License: Open Data Commons Open Database License (ODbL)
 * 
 * @author AgentFlow Pro Team
 * @version 1.0.0
 */

import { parse } from 'csv-parse/sync';
import { createWriteStream, existsSync, readFileSync, mkdirSync } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';
import https from 'https';
import path from 'path';

const streamPipeline = promisify(pipeline);

// ============================================================================
// TYPES
// ============================================================================

interface OpenTravelPOI {
  por_name: string;
  por_type: string;
  latitude: number;
  longitude: number;
  country_code: string;
  iata_code?: string;
  icao_code?: string;
}

interface Attraction {
  name: string;
  type: string;
  distance_km: number;
  latitude: number;
  longitude: number;
  country_code: string;
  iata_code?: string;
}

interface Airport {
  name: string;
  iata_code: string;
  icao_code?: string;
  latitude: number;
  longitude: number;
  country_code: string;
  distance_km?: number;
}

interface CacheData {
  data: OpenTravelPOI[];
  timestamp: number;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class OpenTravelDataService {
  private cache: CacheData | null = null;
  private readonly CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
  private readonly DATA_URL = 'https://raw.githubusercontent.com/opentraveldata/opentraveldata/master/opentraveldata/por.csv';
  private readonly LOCAL_PATH = './data/opentraveldata-por.csv';

  /**
   * Initialize service - load data on startup
   * Call this once when your app starts
   */
  async initialize(): Promise<void> {
    console.log('[OpenTravelData] Initializing service...');
    
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.LOCAL_PATH);
      if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
      }

      await this.loadData();
      console.log(`[OpenTravelData] ✅ Loaded ${this.cache?.data.length.toLocaleString()} POIs`);
    } catch (error) {
      console.error('[OpenTravelData] ❌ Failed to initialize:', error);
      console.log('[OpenTravelData] Will retry on first request');
    }
  }

  /**
   * Get nearby attractions for guest recommendations
   * 
   * @param latitude - Property latitude
   * @param longitude - Property longitude
   * @param radiusKm - Search radius in kilometers (default: 10)
   * @param limit - Max results to return (default: 20)
   * @returns Array of attractions sorted by distance
   * 
   * @example
   * const attractions = await openTravelData.getNearbyAttractions(
   *   46.3683, // Bled
   *   14.1146,
   *   10,      // 10km radius
   *   10       // Top 10
   * );
   */
  async getNearbyAttractions(
    latitude: number,
    longitude: number,
    radiusKm: number = 10,
    limit: number = 20
  ): Promise<Attraction[]> {
    try {
      await this.ensureDataLoaded();

      if (!this.cache?.data) {
        console.warn('[OpenTravelData] No data available, returning empty array');
        return [];
      }

      // Attraction types to include
      const attractionTypes = new Set([
        'attraction', 'museum', 'park', 'beach', 'castle', 'church',
        'monument', 'cathedral', 'basilica', 'chapel', 'ruins',
        'archaeological_site', 'viewpoint', 'garden', 'zoo',
        'theme_park', 'nature_reserve', 'lighthouse', 'memorial'
      ]);

      const attractions = this.cache.data
        .filter(poi => {
          // Filter by type
          const poiType = poi.por_type.toLowerCase();
          const isAttraction = attractionTypes.has(poiType) ||
            poiType.includes('attraction') ||
            poiType.includes('museum') ||
            poiType.includes('castle');

          if (!isAttraction) return false;

          // Filter by distance
          const distance = this.calculateDistance(
            latitude, longitude,
            poi.latitude, poi.longitude
          );

          return distance <= radiusKm;
        })
        .map(poi => ({
          name: poi.por_name,
          type: poi.por_type,
          distance_km: this.calculateDistance(
            latitude, longitude,
            poi.latitude, poi.longitude
          ),
          latitude: poi.latitude,
          longitude: poi.longitude,
          country_code: poi.country_code,
          iata_code: poi.iata_code,
        }))
        .sort((a, b) => a.distance_km - b.distance_km)
        .slice(0, limit);

      console.log(`[OpenTravelData] Found ${attractions.length} attractions within ${radiusKm}km`);
      return attractions;
    } catch (error) {
      console.error('[OpenTravelData] getNearbyAttractions error:', error);
      return []; // Graceful degradation - don't break guest experience
    }
  }

  /**
   * Get airports by country code
   * 
   * @param countryCode - ISO country code (e.g., 'SI' for Slovenia)
   * @returns Array of airports in that country
   * 
   * @example
   * const airports = await openTravelData.getAirportsByCountry('SI');
   * // Returns: LJU (Ljubljana), MBX (Maribor), etc.
   */
  async getAirportsByCountry(countryCode: string): Promise<Airport[]> {
    await this.ensureDataLoaded();

    if (!this.cache?.data) {
      return [];
    }

    const airports = this.cache.data
      .filter(poi => poi.por_type === 'airport' && poi.country_code === countryCode)
      .map(poi => ({
        name: poi.por_name,
        iata_code: poi.iata_code || '',
        icao_code: poi.icao_code,
        latitude: poi.latitude,
        longitude: poi.longitude,
        country_code: poi.country_code,
      }));

    console.log(`[OpenTravelData] Found ${airports.length} airports in ${countryCode}`);
    return airports;
  }

  /**
   * Find nearest airport to a location
   * 
   * @param latitude - Location latitude
   * @param longitude - Location longitude
   * @param countryCode - Optional country filter
   * @returns Nearest airport with distance
   * 
   * @example
   * const airport = await openTravelData.getNearestAirport(
   *   46.3683, // Bled
   *   14.1146,
   *   'SI'     // Slovenia only
   * );
   */
  async getNearestAirport(
    latitude: number,
    longitude: number,
    countryCode?: string
  ): Promise<Airport | null> {
    await this.ensureDataLoaded();

    if (!this.cache?.data) {
      return null;
    }

    let airports = this.cache.data
      .filter(poi => poi.por_type === 'airport')
      .filter(poi => !countryCode || poi.country_code === countryCode)
      .map(poi => ({
        name: poi.por_name,
        iata_code: poi.iata_code || '',
        icao_code: poi.icao_code,
        latitude: poi.latitude,
        longitude: poi.longitude,
        country_code: poi.country_code,
        distance_km: this.calculateDistance(
          latitude, longitude,
          poi.latitude, poi.longitude
        ),
      }))
      .sort((a, b) => (a.distance_km || 0) - (b.distance_km || 0));

    return airports[0] || null;
  }

  /**
   * Get all POIs by type
   * 
   * @param type - POI type (e.g., 'airport', 'attraction')
   * @param countryCode - Optional country filter
   * @returns Array of POIs
   */
  async getPOIsByType(type: string, countryCode?: string): Promise<OpenTravelPOI[]> {
    await this.ensureDataLoaded();

    if (!this.cache?.data) {
      return [];
    }

    const pois = this.cache.data.filter(poi =>
      poi.por_type.toLowerCase() === type.toLowerCase() &&
      (!countryCode || poi.country_code === countryCode)
    );

    console.log(`[OpenTravelData] Found ${pois.length} POIs of type '${type}'`);
    return pois;
  }

  /**
   * Get cache statistics
   */
  getCacheInfo(): { loaded: boolean; count: number; age: string } {
    if (!this.cache) {
      return { loaded: false, count: 0, age: 'N/A' };
    }

    const ageMs = Date.now() - this.cache.timestamp;
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

    return {
      loaded: true,
      count: this.cache.data.length,
      age: `${ageHours}h ago`
    };
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /**
   * Ensure data is loaded (from cache or download)
   */
  private async ensureDataLoaded(): Promise<void> {
    // Check if cache is valid
    if (this.cache && Date.now() - this.cache.timestamp < this.CACHE_DURATION) {
      return; // Cache is valid
    }

    console.log('[OpenTravelData] Cache expired or missing, reloading...');
    await this.loadData();
  }

  /**
   * Load data from local file or download from GitHub
   */
  private async loadData(): Promise<void> {
    try {
      // Try local file first (faster)
      if (existsSync(this.LOCAL_PATH)) {
        console.log('[OpenTravelData] Loading from local cache...');
        const csv = readFileSync(this.LOCAL_PATH, 'utf-8');
        this.cache = {
          data: this.parseCSV(csv),
          timestamp: Date.now(),
        };
        return;
      }

      // Download from GitHub
      console.log('[OpenTravelData] Downloading from GitHub...');
      const file = createWriteStream(this.LOCAL_PATH);
      
      await streamPipeline(
        https.get(this.DATA_URL),
        file
      );

      const csv = readFileSync(this.LOCAL_PATH, 'utf-8');
      this.cache = {
        data: this.parseCSV(csv),
        timestamp: Date.now(),
      };

      console.log('[OpenTravelData] ✅ Download complete');
    } catch (error) {
      console.error('[OpenTravelData] Load error:', error);
      throw error;
    }
  }

  /**
   * Parse CSV data from OpenTravelData
   */
  private parseCSV(csv: string): OpenTravelPOI[] {
    try {
      const records = parse(csv, {
        columns: true,
        skip_empty_lines: true,
        relax_column_count: true,
        trim: true,
      });

      const pois = records
        .filter((row: any) => row.latitude && row.longitude)
        .map((row: any) => ({
          por_name: row.name || row.por_name || row.title || 'Unknown',
          por_type: row.type || row.por_type || 'unknown',
          latitude: parseFloat(row.latitude) || 0,
          longitude: parseFloat(row.longitude) || 0,
          country_code: row.country_code || row.iso_country || 'XX',
          iata_code: row.iata_code || row.iata || undefined,
          icao_code: row.icao_code || row.icao || undefined,
        }))
        .filter((poi: OpenTravelPOI) => poi.latitude !== 0 && poi.longitude !== 0);

      console.log(`[OpenTravelData] Parsed ${pois.length.toLocaleString()} valid POIs`);
      return pois;
    } catch (error) {
      console.error('[OpenTravelData] CSV parse error:', error);
      return [];
    }
  }

  /**
   * Calculate distance between two points (Haversine formula)
   * Returns distance in kilometers
   */
  private calculateDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * Math.PI / 180;
  }
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const openTravelData = new OpenTravelDataService();

// ============================================================================
// QUICK TEST (uncomment for testing)
// ============================================================================

// if (require.main === module) {
//   (async () => {
//     await openTravelData.initialize();
//     
//     // Test: Get attractions near Bled, Slovenia
//     const attractions = await openTravelData.getNearbyAttractions(
//       46.3683, // Bled latitude
//       14.1146, // Bled longitude
//       10,      // 10km radius
//       10       // Top 10
//     );
//     
//     console.log('\n🏰 Top 10 Attractions near Bled:');
//     attractions.forEach((attr, i) => {
//       console.log(`${i + 1}. ${attr.name} (${attr.type}) - ${attr.distance_km.toFixed(1)}km`);
//     });
//     
//     // Test: Get nearest airport
//     const airport = await openTravelData.getNearestAirport(
//       46.3683,
//       14.1146,
//       'SI'
//     );
//     
//     console.log(`\n✈️ Nearest Airport: ${airport?.name} (${airport?.iata_code}) - ${airport?.distance_km.toFixed(0)}km`);
//     
//     // Test: Cache info
//     console.log('\n📊 Cache Info:', openTravelData.getCacheInfo());
//   })();
// }
