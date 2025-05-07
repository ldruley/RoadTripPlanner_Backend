import { NestFactory } from '@nestjs/core';
import { AppModule } from '../../app.module';
import { LocationsService } from '../../domain/locations/locations.service';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const locationsService = app.get(LocationsService);

  console.log('🌱 Starting iconic landmarks seed process...');

  // Define iconic California landmarks
  const landmarks = [
    {
      name: 'Golden Gate Bridge',
      description: 'Iconic suspension bridge spanning the Golden Gate strait',
      address: 'Golden Gate Bridge, San Francisco, CA 94129',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94129',
      latitude: 37.8199,
      longitude: -122.4783,
      category: 'Landmark',
    },
    {
      name: 'Alcatraz Island',
      description: 'Historic federal prison on an island in San Francisco Bay',
      address: 'San Francisco, CA 94133',
      city: 'San Francisco',
      state: 'CA',
      postal_code: '94133',
      latitude: 37.827,
      longitude: -122.423,
      category: 'Historical Site',
    },
    {
      name: 'Hollywood Sign',
      description: 'Famous landmark in the Hollywood Hills',
      address: 'Los Angeles, CA 90068',
      city: 'Los Angeles',
      state: 'CA',
      postal_code: '90068',
      latitude: 34.1341,
      longitude: -118.3215,
      category: 'Landmark',
    },
    {
      name: 'Griffith Observatory',
      description: 'Astronomy museum with spectacular views of Los Angeles',
      address: '2800 E Observatory Rd, Los Angeles, CA 90027',
      city: 'Los Angeles',
      state: 'CA',
      postal_code: '90027',
      latitude: 34.1184,
      longitude: -118.3004,
      category: 'Museum',
    },
    {
      name: 'Disneyland Park',
      description:
        'Iconic theme park featuring Disney characters and attractions',
      address: '1313 Disneyland Dr, Anaheim, CA 92802',
      city: 'Anaheim',
      state: 'CA',
      postal_code: '92802',
      latitude: 33.8121,
      longitude: -117.919,
      category: 'Tourist Attraction',
    },
    {
      name: 'Santa Monica Pier',
      description: 'Historic pier with amusement park and scenic views',
      address: '200 Santa Monica Pier, Santa Monica, CA 90401',
      city: 'Santa Monica',
      state: 'CA',
      postal_code: '90401',
      latitude: 34.0083,
      longitude: -118.4987,
      category: 'Tourist Attraction',
    },
    {
      name: 'Hearst Castle',
      description:
        'Opulent estate built for newspaper magnate William Randolph Hearst',
      address: '750 Hearst Castle Rd, San Simeon, CA 93452',
      city: 'San Simeon',
      state: 'CA',
      postal_code: '93452',
      latitude: 35.6852,
      longitude: -121.1665,
      category: 'Historical Site',
    },
    {
      name: 'Half Dome',
      description: 'Iconic granite dome in Yosemite National Park',
      address: 'Yosemite National Park, CA',
      city: 'Yosemite National Park',
      state: 'CA',
      latitude: 37.7459,
      longitude: -119.5332,
      category: 'Natural Landmark',
    },
    {
      name: 'Monterey Bay Aquarium',
      description: 'World-class aquarium featuring marine life exhibits',
      address: '886 Cannery Row, Monterey, CA 93940',
      city: 'Monterey',
      state: 'CA',
      postal_code: '93940',
      latitude: 36.6182,
      longitude: -121.9018,
      category: 'Tourist Attraction',
    },
    {
      name: 'Big Sur',
      description: 'Scenic coastline with breathtaking views and hiking trails',
      address: 'Big Sur, CA 93920',
      city: 'Big Sur',
      state: 'CA',
      postal_code: '93920',
      latitude: 36.2704,
      longitude: -121.8081,
      category: 'Scenic Point',
    },
    // Add more West Coast landmarks
    {
      name: 'In-N-Out Burger',
      description: 'Iconic California fast food restaurant',
      address: '9149 S Sepulveda Blvd, Los Angeles, CA 90045',
      city: 'Los Angeles',
      state: 'CA',
      postal_code: '90045',
      latitude: 33.9534,
      longitude: -118.3987,
      category: 'Restaurant',
    },
    {
      name: 'Winchester Mystery House',
      description: 'Historic mansion known for its architectural oddities',
      address: '525 S Winchester Blvd, San Jose, CA 95128',
      city: 'San Jose',
      state: 'CA',
      postal_code: '95128',
      latitude: 37.3184,
      longitude: -121.9511,
      category: 'Historical Site',
    },
    {
      name: 'Muir Woods National Monument',
      description: 'Ancient redwood forest near San Francisco',
      address: '1 Muir Woods Rd, Mill Valley, CA 94941',
      city: 'Mill Valley',
      state: 'CA',
      postal_code: '94941',
      latitude: 37.8915,
      longitude: -122.5719,
      category: 'National Monument',
    },
  ];

  let totalLocations = 0;

  for (const landmark of landmarks) {
    try {
      await locationsService.createLocation({
        name: landmark.name,
        description: landmark.description,
        address: landmark.address,
        city: landmark.city,
        state: landmark.state,
        postal_code: landmark.postal_code || '',
        country: 'USA',
        latitude: landmark.latitude,
        longitude: landmark.longitude,
        external_id: `iconic_${landmark.name.replace(/\s+/g, '_').toLowerCase()}`,
        external_source: 'curated',
        category: landmark.category,
        is_verified: true,
      });

      console.log(`✅ Added iconic landmark: ${landmark.name}`);
      totalLocations++;
    } catch (error) {
      console.error(
        `❌ Failed to add landmark: ${landmark.name}`,
        error.message,
      );
    }
  }

  console.log(
    `🎉 Iconic landmarks seeding completed! Total locations added: ${totalLocations}`,
  );
  await app.close();
}

bootstrap()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error during landmarks seeding:', error);
    process.exit(1);
  });
