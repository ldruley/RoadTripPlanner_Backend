import { NestFactory } from '@nestjs/core';
import axios from 'axios';
import { AppModule } from '../../app.module';
import { LocationsService } from '../../domain/locations/locations.service';

// Define interfaces for NPS API response structure
interface NPSPoint {
  fullName: string;
  description: string;
  latitude: string;
  longitude: string;
  url: string;
  id: string;
  parkCode: string;
  addresses: {
    line1: string;
    line2: string;
    line3: string;
    city: string;
    stateCode: string;
    postalCode: string;
    type: string;
  }[];
}

interface NPSApiResponse {
  data: NPSPoint[];
  total: string;
  limit: string;
  start: string;
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
  const parks: { name: string; parkCode: string }[] = [
    { name: 'Yosemite', parkCode: 'yose' },
    { name: 'Death Valley', parkCode: 'deva' },
    { name: 'Joshua Tree', parkCode: 'jotr' },
    { name: 'Sequoia & Kings Canyon', parkCode: 'seki' },
    { name: 'Redwood', parkCode: 'redw' },
    { name: 'Channel Islands', parkCode: 'chis' },
    { name: 'Lassen Volcanic', parkCode: 'lavo' },
    { name: 'Pinnacles', parkCode: 'pinn' },
  ];

  let totalLocations = 0;

  // Get API key from environment variable
  const apiKey = process.env.NPS_API_KEY;
  if (!apiKey) {
    console.error('❌ NPS API key not found in environment variables.');
    console.error('Please set the NPS_API_KEY environment variable.');
    await app.close();
    process.exit(1);
  }

  for (const park of parks) {
    console.log(`📍 Processing ${park.name} National Park...`);

    try {
      // First fetch the park information
      const parkApiUrl = `https://developer.nps.gov/api/v1/parks?parkCode=${park.parkCode}&api_key=${apiKey}`;
      const parkResponse = await axios.get<NPSApiResponse>(parkApiUrl);

      if (!parkResponse.data.data || parkResponse.data.data.length === 0) {
        console.log(`  ⚠️ No park data found for ${park.name}`);
        continue;
      }

      const parkData = parkResponse.data.data[0];

      // Continue only if the park has valid coordinates
      if (
        !parkData.latitude ||
        !parkData.longitude ||
        parkData.latitude === '0' ||
        parkData.longitude === '0'
      ) {
        console.log(`  ⚠️ No valid coordinates for ${park.name}`);
        continue;
      }

      // Get physical address if available
      let address = '';
      let city = '';
      let postalCode = '';

      const physicalAddress = parkData.addresses?.find(
        (addr) => addr.type === 'Physical',
      );
      if (physicalAddress) {
        address = [
          physicalAddress.line1,
          physicalAddress.line2,
          physicalAddress.line3,
        ]
          .filter(Boolean)
          .join(', ');
        city = physicalAddress.city;
        postalCode = physicalAddress.postalCode;
      }

      try {
        // Create park location in the database
        const locationData: LocationCreateData = {
          name: parkData.fullName,
          description: parkData.description,
          address: address,
          city: city,
          state: 'CA',
          postal_code: postalCode,
          country: 'USA',
          latitude: parseFloat(parkData.latitude),
          longitude: parseFloat(parkData.longitude),
          external_id: `nps_${parkData.id}`,
          external_source: 'nps',
          category: 'National Park',
          is_verified: true,
        };

        await locationsService.createLocation(locationData);
        console.log(`  ✅ Added ${park.name} National Park`);
        totalLocations++;

        // Now try to get visitor centers and points of interest
        try {
          const visitorCentersUrl = `https://developer.nps.gov/api/v1/visitorcenters?parkCode=${park.parkCode}&api_key=${apiKey}`;
          const visitorResponse = await axios.get(visitorCentersUrl);

          if (
            visitorResponse.data.data &&
            visitorResponse.data.data.length > 0
          ) {
            console.log(
              `  📍 Found ${visitorResponse.data.data.length} visitor centers`,
            );

            for (const center of visitorResponse.data.data) {
              // Only add centers with valid coordinates
              if (
                !center.latitude ||
                !center.longitude ||
                center.latitude === '0' ||
                center.longitude === '0'
              ) {
                continue;
              }

              // Get physical address if available
              let centerAddress = '';
              let centerCity = '';
              let centerPostalCode = '';

              const centerPhysicalAddress = center.addresses?.find(
                (addr) => addr.type === 'Physical',
              );
              if (centerPhysicalAddress) {
                centerAddress = [
                  centerPhysicalAddress.line1,
                  centerPhysicalAddress.line2,
                  centerPhysicalAddress.line3,
                ]
                  .filter(Boolean)
                  .join(', ');
                centerCity = centerPhysicalAddress.city;
                centerPostalCode = centerPhysicalAddress.postalCode;
              }

              const centerData = {
                name: center.name,
                description:
                  center.description ||
                  `Visitor center in ${park.name} National Park`,
                address: centerAddress,
                city: centerCity,
                state: 'CA',
                postal_code: centerPostalCode,
                country: 'USA',
                latitude: parseFloat(center.latitude),
                longitude: parseFloat(center.longitude),
                external_id: `nps_vc_${center.id}`,
                external_source: 'nps',
                category: 'Visitor Center',
                is_verified: true,
              };

              await locationsService.createLocation(centerData);
              totalLocations++;
            }
          }
        } catch (error) {
          console.log(`  ⚠️ Could not fetch visitor centers for ${park.name}`);
        }
      } catch (error) {
        if (error instanceof Error) {
          console.error(
            `  ❌ Failed to save park location: ${parkData.fullName}`,
            error.message,
          );
        } else {
          console.error(
            `  ❌ Failed to save park location: ${parkData.fullName}`,
            String(error),
          );
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

    // Add a small delay between parks to avoid rate limiting
    await new Promise((resolve) => setTimeout(resolve, 500));
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
