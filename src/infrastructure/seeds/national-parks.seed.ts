import { NestFactory } from '@nestjs/core';
import axios from 'axios';
import { AppModule } from '../../app.module';
import { LocationsService } from '../../domain/locations/locations.service';

// Define interfaces for NPS API response structure
interface NPSPointOfInterest {
  id: string;
  title: string;
  description?: string;
  latitude: string;
  longitude: string;
  address?: string;
  city?: string;
  postalCode?: string;
  category?: string;
}

interface NPSApiResponse {
  data: {
    data: NPSPointOfInterest[];
  };
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

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const locationsService = app.get(LocationsService);

  console.log('🌱 Starting national park location seed process...');

  // Define California national parks
  const parks: { name: string; id: string }[] = [
    { name: 'Yosemite', id: 'yose' },
    { name: 'Death Valley', id: 'deva' },
    { name: 'Joshua Tree', id: 'jotr' },
    { name: 'Sequoia & Kings Canyon', id: 'seki' },
    { name: 'Redwood', id: 'redw' },
    { name: 'Channel Islands', id: 'chis' },
    { name: 'Lassen Volcanic', id: 'lavo' },
    { name: 'Pinnacles', id: 'pinn' },
  ];

  let totalLocations = 0;

  for (const park of parks) {
    console.log(`📍 Processing ${park.name} National Park...`);

    try {
      // Fetch points of interest from NPS API
      // NOTE: You should replace YOUR_NPS_API_KEY with a valid key
      const apiUrl = `https://developer.nps.gov/api/v1/points?parkCode=${park.id}&api_key=YOUR_NPS_API_KEY`;
      const response = await axios.get<NPSApiResponse>(apiUrl);

      if (!response.data.data || response.data.data.length === 0) {
        console.log(`  ⚠️ No points of interest found in ${park.name}`);
        continue;
      }

      console.log(`  ✓ Found ${response.data.data.length} points of interest`);

      // Process each point of interest
      for (const poi of response.data.data) {
        if (!poi.latitude || !poi.longitude) continue;

        try {
          // Map NPS categories to simple strings
          let category = 'Tourist Attraction';
          if (poi.category === 'Natural') category = 'Natural Landmark';
          if (poi.category === 'Historic') category = 'Historical Site';
          if (poi.category === 'Scenic') category = 'Scenic Point';

          // Create location in the database
          const locationData: LocationCreateData = {
            name: poi.title,
            description:
              poi.description ||
              `Point of interest in ${park.name} National Park`,
            address: poi.address || '',
            city: poi.city || '',
            state: 'CA',
            postal_code: poi.postalCode || '',
            country: 'USA',
            latitude: parseFloat(poi.latitude),
            longitude: parseFloat(poi.longitude),
            external_id: `nps_${poi.id}`,
            external_source: 'nps',
            category: category,
            is_verified: true,
          };

          await locationsService.createLocation(locationData);

          totalLocations++;
        } catch (error) {
          if (error instanceof Error) {
            console.error(
              `  ❌ Failed to save location: ${poi.title}`,
              error.message,
            );
          } else {
            console.error(
              `  ❌ Failed to save location: ${poi.title}`,
              String(error),
            );
          }
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error(
          `  ❌ Error fetching data for ${park.name}:`,
          error.message,
        );
      } else {
        console.error(
          `  ❌ Error fetching data for ${park.name}:`,
          String(error),
        );
      }
    }
  }

  console.log(
    `🎉 NPS seeding completed! Total locations added: ${totalLocations}`,
  );
  await app.close();
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error: unknown) => {
    if (error instanceof Error) {
      console.error('Error during NPS location seeding:', error.message);
    } else {
      console.error('Error during NPS location seeding:', String(error));
    }
    process.exit(1);
  });
