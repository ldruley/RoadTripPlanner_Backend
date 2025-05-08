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
    {
      name: 'Crater Lake National Park',
      description: 'Deepest lake in the U.S., formed in a collapsed volcano',
      address: 'Crater Lake National Park, OR 97604',
      city: 'Crater Lake',
      state: 'OR',
      postal_code: '97604',
      latitude: 42.9446,
      longitude: -122.109,
      category: 'National Park',
    },
    {
      name: 'Multnomah Falls',
      description:
        'Spectacular two-tiered waterfall in the Columbia River Gorge',
      address: '50000 Historic Columbia River Hwy, Bridal Veil, OR 97010',
      city: 'Bridal Veil',
      state: 'OR',
      postal_code: '97010',
      latitude: 45.5762,
      longitude: -122.1158,
      category: 'Natural Landmark',
    },
    {
      name: 'Haystack Rock',
      description: 'Iconic rock formation on the Oregon Coast at Cannon Beach',
      address: 'Cannon Beach, OR 97110',
      city: 'Cannon Beach',
      state: 'OR',
      postal_code: '97110',
      latitude: 45.8844,
      longitude: -123.9668,
      category: 'Scenic Point',
    },
    {
      name: 'Space Needle',
      description:
        'Futuristic observation tower built for the 1962 World’s Fair',
      address: '400 Broad St, Seattle, WA 98109',
      city: 'Seattle',
      state: 'WA',
      postal_code: '98109',
      latitude: 47.6205,
      longitude: -122.3493,
      category: 'Landmark',
    },
    {
      name: 'Pike Place Market',
      description: 'Historic farmers market overlooking the Seattle waterfront',
      address: '85 Pike St, Seattle, WA 98101',
      city: 'Seattle',
      state: 'WA',
      postal_code: '98101',
      latitude: 47.6094,
      longitude: -122.3417,
      category: 'Tourist Attraction',
    },
    {
      name: 'Mount Rainier',
      description:
        'Massive stratovolcano and centerpiece of Mount Rainier National Park',
      address: 'Mount Rainier National Park, WA',
      city: 'Ashford',
      state: 'WA',
      postal_code: '98304',
      latitude: 46.8523,
      longitude: -121.7603,
      category: 'Natural Landmark',
    },
    {
      name: 'Olympic National Park',
      description: 'Diverse park with mountains, rainforests, and coastline',
      address: '3002 Mt Angeles Rd, Port Angeles, WA 98362',
      city: 'Port Angeles',
      state: 'WA',
      postal_code: '98362',
      latitude: 47.8021,
      longitude: -123.6044,
      category: 'National Park',
    },
    {
      name: 'Columbia River Gorge',
      description:
        'Scenic canyon along the Columbia River with waterfalls and viewpoints',
      address: 'Columbia River Gorge National Scenic Area, OR',
      city: 'Hood River',
      state: 'OR',
      postal_code: '97031',
      latitude: 45.725,
      longitude: -121.7313,
      category: 'Scenic Point',
    },
    {
      name: 'Hoover Dam',
      description: 'Massive concrete arch-gravity dam on the Colorado River',
      address: 'Hoover Dam Access Rd, Boulder City, NV 89005',
      city: 'Boulder City',
      state: 'NV',
      postal_code: '89005',
      latitude: 36.0156,
      longitude: -114.7378,
      category: 'Historical Site',
    },
    {
      name: 'Las Vegas Strip',
      description:
        'Iconic stretch of resorts, casinos, and entertainment venues',
      address: 'Las Vegas Strip, Las Vegas, NV 89109',
      city: 'Las Vegas',
      state: 'NV',
      postal_code: '89109',
      latitude: 36.1147,
      longitude: -115.1728,
      category: 'Tourist Attraction',
    },
    {
      name: 'Red Rock Canyon National Conservation Area',
      description:
        'Scenic desert area with red rock formations and hiking trails',
      address: '1000 Scenic Loop Dr, Las Vegas, NV 89161',
      city: 'Las Vegas',
      state: 'NV',
      postal_code: '89161',
      latitude: 36.1357,
      longitude: -115.427,
      category: 'Natural Landmark',
    },
    {
      name: 'Lake Tahoe',
      description:
        'Large freshwater lake in the Sierra Nevada, straddling NV and CA',
      address: 'Lake Tahoe, NV',
      city: 'Incline Village',
      state: 'NV',
      postal_code: '89451',
      latitude: 39.0968,
      longitude: -120.0324,
      category: 'Scenic Point',
    },
    {
      name: 'Great Basin National Park',
      description:
        'Remote park with caves, ancient bristlecone pines, and Wheeler Peak',
      address: 'Great Basin National Park, NV 89311',
      city: 'Baker',
      state: 'NV',
      postal_code: '89311',
      latitude: 38.9833,
      longitude: -114.306,
      category: 'National Park',
    },
    {
      name: 'Shoshone Falls',
      description: '“Niagara of the West,” higher than Niagara Falls',
      address: '4155 Shoshone Falls Grade, Twin Falls, ID 83301',
      city: 'Twin Falls',
      state: 'ID',
      postal_code: '83301',
      latitude: 42.5937,
      longitude: -114.3823,
      category: 'Natural Landmark',
    },
    {
      name: 'Craters of the Moon National Monument',
      description: 'Vast lava field with volcanic cones and caves',
      address: '1266 Craters Loop Rd, Arco, ID 83213',
      city: 'Arco',
      state: 'ID',
      postal_code: '83213',
      latitude: 43.4166,
      longitude: -113.5166,
      category: 'National Monument',
    },
    {
      name: 'Sun Valley Resort',
      description:
        'Historic ski resort known for celebrity guests and alpine terrain',
      address: '1 Sun Valley Rd, Sun Valley, ID 83353',
      city: 'Sun Valley',
      state: 'ID',
      postal_code: '83353',
      latitude: 43.697,
      longitude: -114.3518,
      category: 'Tourist Attraction',
    },
    {
      name: 'Old Idaho Penitentiary',
      description: 'Historic former prison dating back to 1872',
      address: '2445 Old Penitentiary Rd, Boise, ID 83712',
      city: 'Boise',
      state: 'ID',
      postal_code: '83712',
      latitude: 43.602,
      longitude: -116.1621,
      category: 'Historical Site',
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
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
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
