import { NestFactory } from '@nestjs/core';
import axios from 'axios';
import { AppModule } from '../../app.module';
import { LocationsService } from '../../domain/locations/locations.service';

// Define interfaces for OpenStreetMap API response structure
interface OSMTags {
  name?: string;
  description?: string;
  tourism?: string;
  amenity?: string;
  historic?: string;
  natural?: string;
  leisure?: string;
  'addr:street'?: string;
  'addr:city'?: string;
  'addr:state'?: string;
  'addr:postcode'?: string;
  'addr:country'?: string;
  address?: string;
  city?: string;
  postcode?: string;
}

interface OSMElementCenter {
  lat: number;
  lon: number;
}

interface OSMElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  center?: OSMElementCenter;
  tags?: OSMTags;
}

interface OSMApiResponse {
  version: number;
  generator: string;
  osm3s?: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: OSMElement[];
}

// Interface for the location data we'll be creating
interface LocationCreateData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  latitude: number;
  longitude: number;
  external_id: string;
  external_source: string;
  category: string;
  is_verified: boolean;
}

interface Region {
  name: string;
  bbox: string;
}

interface Category {
  type: string;
  name: string;
}

// Helper function to map OSM tags to simple category strings
function mapOsmTagsToCategory(tags: OSMTags | undefined): string {
  if (!tags) return 'Other';

  // Tourism-related mappings
  if (tags.tourism === 'attraction') return 'Tourist Attraction';
  if (tags.tourism === 'hotel') return 'Hotel';
  if (tags.tourism === 'motel') return 'Motel';
  if (tags.tourism === 'museum') return 'Museum';
  if (tags.tourism === 'viewpoint') return 'Scenic Point';
  if (tags.tourism === 'camp_site') return 'Campground';

  // Amenity-related mappings
  if (tags.amenity === 'restaurant') return 'Restaurant';
  if (tags.amenity === 'cafe') return 'Cafe';
  if (tags.amenity === 'fast_food') return 'Fast Food';
  if (tags.amenity === 'fuel' || tags.amenity === 'gas_station')
    return 'Gas Station';
  if (tags.amenity === 'parking') return 'Parking';
  if (tags.amenity === 'pharmacy') return 'Pharmacy';

  // Natural features
  if (tags.natural === 'beach') return 'Beach';
  if (tags.leisure === 'park') return 'Park';

  // Historic sites and landmarks
  if (tags.historic === 'monument') return 'Historical Monument';
  if (tags.historic) return 'Historical Site';

  // Default
  return 'Other';
}

// Helper function to extract address components from OSM tags
function extractAddressComponents(tags: OSMTags | undefined): {
  address: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
} {
  if (!tags) {
    return {
      address: '',
      city: '',
      state: 'CA',
      postal_code: '',
      country: 'USA',
    };
  }

  return {
    address: tags['addr:street'] || tags.address || '',
    city: tags['addr:city'] || tags.city || '',
    state: tags['addr:state'] || 'CA',
    postal_code: tags['addr:postcode'] || tags.postcode || '',
    country: tags['addr:country'] || 'USA',
  };
}

async function fetchOverpassData(query: string): Promise<OSMApiResponse> {
  const overpassEndpoint = 'https://overpass-api.de/api/interpreter';
  const response = await axios.post<OSMApiResponse>(overpassEndpoint, query, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const locationsService = app.get(LocationsService);

  console.log('🌱 Starting location seed process from OpenStreetMap data...');

  // Define regions in California to focus on (West Coast)
  const regions: Region[] = [
    { name: 'San Francisco Bay Area', bbox: '37.2,-122.6,38.0,-121.7' },
    { name: 'Los Angeles', bbox: '33.7,-118.7,34.3,-117.7' },
    { name: 'San Diego', bbox: '32.5,-117.3,33.1,-116.8' },
    { name: 'Yosemite', bbox: '37.5,-119.7,37.9,-119.0' },
    { name: 'Lake Tahoe', bbox: '38.8,-120.3,39.3,-119.8' },
    { name: 'Big Sur', bbox: '36.0,-121.9,36.5,-121.7' },
    { name: 'Napa Valley', bbox: '38.2,-122.4,38.6,-122.1' },
  ];

  // Categories to extract from OSM
  const categories: Category[] = [
    { type: 'tourism=attraction', name: 'Tourist Attractions' },
    { type: 'tourism=hotel', name: 'Hotels' },
    { type: 'tourism=museum', name: 'Museums' },
    { type: 'tourism=viewpoint', name: 'Viewpoints' },
    { type: 'amenity=restaurant', name: 'Restaurants' },
    { type: 'amenity=cafe', name: 'Cafes' },
    { type: 'amenity=fuel', name: 'Gas Stations' },
    { type: 'natural=beach', name: 'Beaches' },
    { type: 'historic', name: 'Historic Sites' },
    { type: 'leisure=park', name: 'Parks' },
  ];

  let totalLocations = 0;

  // Process each region
  for (const region of regions) {
    console.log(`📍 Processing ${region.name}...`);

    // Process each category in the region
    for (const category of categories) {
      try {
        console.log(`  🔍 Fetching ${category.name}...`);

        // Build Overpass query
        const overpassQuery = `
          [out:json];
            (
              ${
                category.type === 'historic'
                  ? `
                  node[historic](${region.bbox});
                  way[historic](${region.bbox});
                  relation[historic](${region.bbox});
                `
                  : `
                  node[${category.type}](${region.bbox});
                  way[${category.type}](${region.bbox});
                  relation[${category.type}](${region.bbox});
                `
              }
            );
          out center;
        `;

        // Fetch data from Overpass API
        const data = await fetchOverpassData(overpassQuery);

        if (!data.elements || data.elements.length === 0) {
          console.log(`  ⚠️ No ${category.name} found in ${region.name}`);
          continue;
        }

        console.log(`  ✓ Found ${data.elements.length} ${category.name}`);

        // Process each element
        for (const element of data.elements) {
          if (!element.tags || !element.tags.name) continue;

          // Get coordinates (handle different element types)
          let lat: number | undefined, lon: number | undefined;
          if (element.type === 'node') {
            lat = element.lat;
            lon = element.lon;
          } else if (element.center) {
            lat = element.center.lat;
            lon = element.center.lon;
          } else {
            continue; // Skip if no coordinates
          }

          // Skip if coordinates are missing
          if (lat === undefined || lon === undefined) continue;

          // Extract address components
          const addressComponents = extractAddressComponents(element.tags);

          // Map category
          const mappedCategory = mapOsmTagsToCategory(element.tags);

          try {
            // Create location in the database
            const locationData: LocationCreateData = {
              name: element.tags.name,
              description:
                element.tags.description ||
                element.tags.tourism ||
                element.tags.amenity ||
                '',
              address: addressComponents.address,
              city: addressComponents.city,
              state: addressComponents.state,
              postal_code: addressComponents.postal_code,
              country: addressComponents.country,
              latitude: lat,
              longitude: lon,
              external_id: `osm_${element.type}_${element.id}`,
              external_source: 'openstreetmap',
              category: mappedCategory,
              is_verified: true,
            };

            await locationsService.createLocation(locationData);

            totalLocations++;
          } catch (error) {
            if (error instanceof Error) {
              console.error(
                `  ❌ Failed to save location: ${element.tags.name}`,
                error.message,
              );
            } else {
              console.error(
                `  ❌ Failed to save location: ${element.tags.name}`,
                String(error),
              );
            }
          }
        }

        // Small delay to avoid overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        if (error instanceof Error) {
          console.error(
            `  ❌ Error fetching ${category.name} in ${region.name}:`,
            error.message,
          );
        } else {
          console.error(
            `  ❌ Error fetching ${category.name} in ${region.name}:`,
            String(error),
          );
        }
      }
    }
  }

  console.log(`🎉 Seeding completed! Total locations added: ${totalLocations}`);
  await app.close();
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    if (error instanceof Error) {
      console.error('Error during location seeding:', error.message);
    } else {
      console.error('Error during location seeding:', String(error));
    }
    process.exit(1);
  });
