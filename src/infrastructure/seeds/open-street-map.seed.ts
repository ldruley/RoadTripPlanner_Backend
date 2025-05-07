import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LocationsService } from '../src/domain/locations/locations.service';
import axios from 'axios';

// Helper function to map OSM tags to simple category strings
function mapOsmTagsToCategory(tags: any): string {
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
function extractAddressComponents(tags: any) {
  return {
    address: tags['addr:street'] || tags.address || '',
    city: tags['addr:city'] || tags.city || '',
    state: tags['addr:state'] || 'CA',
    postal_code: tags['addr:postcode'] || tags.postcode || '',
    country: tags['addr:country'] || 'USA',
  };
}

async function fetchOverpassData(query: string): Promise<any> {
  const overpassEndpoint = 'https://overpass-api.de/api/interpreter';
  const response = await axios.post(overpassEndpoint, query, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return response.data;
}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const locationsService = app.get(LocationsService);

  console.log('🌱 Starting location seed process from OpenStreetMap data...');

  // Define regions in California to focus on (West Coast)
  const regions = [
    { name: 'San Francisco Bay Area', bbox: '37.2,-122.6,38.0,-121.7' },
    { name: 'Los Angeles', bbox: '33.7,-118.7,34.3,-117.7' },
    { name: 'San Diego', bbox: '32.5,-117.3,33.1,-116.8' },
    { name: 'Yosemite', bbox: '37.5,-119.7,37.9,-119.0' },
    { name: 'Lake Tahoe', bbox: '38.8,-120.3,39.3,-119.8' },
    { name: 'Big Sur', bbox: '36.0,-121.9,36.5,-121.7' },
    { name: 'Napa Valley', bbox: '38.2,-122.4,38.6,-122.1' },
  ];

  // Categories to extract from OSM
  const categories = [
    { type: 'tourism=attraction', name: 'Tourist Attractions' },
    { type: 'tourism=hotel', name: 'Hotels' },
    { type: 'tourism=museum', name: 'Museums' },
    { type: 'tourism=viewpoint', name: 'Viewpoints' },
    { type: 'amenity=restaurant', name: 'Restaurants' },
    { type: 'amenity=cafe', name: 'Cafes' },
    { type: 'amenity=fuel', name: 'Gas Stations' },
    { type: 'natural=beach', name: 'Beaches' },
    { type: 'historic=*', name: 'Historic Sites' },
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
            node[${category.type}](${region.bbox});
            way[${category.type}](${region.bbox});
            relation[${category.type}](${region.bbox});
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
          let lat, lon;
          if (element.type === 'node') {
            lat = element.lat;
            lon = element.lon;
          } else if (element.center) {
            lat = element.center.lat;
            lon = element.center.lon;
          } else {
            continue; // Skip if no coordinates
          }

          // Extract address components
          const addressComponents = extractAddressComponents(element.tags);

          // Map category
          const mappedCategory = mapOsmTagsToCategory(element.tags);

          try {
            // Create location in the database
            await locationsService.createLocation({
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
              // Instead of using external_category_id, use the new category field
              category: mappedCategory,
              is_verified: true,
            });

            totalLocations++;
          } catch (error) {
            console.error(
              `  ❌ Failed to save location: ${element.tags.name}`,
              error.message,
            );
          }
        }

        // Small delay to avoid overwhelming the database
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `  ❌ Error fetching ${category.name} in ${region.name}:`,
          error.message,
        );
      }
    }
  }

  console.log(`🎉 Seeding completed! Total locations added: ${totalLocations}`);
  await app.close();
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during location seeding:', error);
    process.exit(1);
  });
