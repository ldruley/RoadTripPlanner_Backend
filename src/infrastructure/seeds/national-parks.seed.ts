import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { LocationsService } from '../src/domain/locations/locations.service';
import axios from 'axios';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const locationsService = app.get(LocationsService);

  console.log('🌱 Starting national park location seed process...');

  // Define California national parks
  const parks = [
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
      const apiUrl = `https://developer.nps.gov/api/v1/points?parkCode=${park.id}&api_key=YOUR_NPS_API_KEY`;
      const response = await axios.get(apiUrl);

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
          await locationsService.createLocation({
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
          });

          totalLocations++;
        } catch (error) {
          console.error(
            `  ❌ Failed to save location: ${poi.title}`,
            error.message,
          );
        }
      }
    } catch (error) {
      console.error(
        `  ❌ Error fetching data for ${park.name}:`,
        error.message,
      );
    }
  }

  console.log(
    `🎉 NPS seeding completed! Total locations added: ${totalLocations}`,
  );
  await app.close();
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during NPS location seeding:', error);
    process.exit(1);
  });
