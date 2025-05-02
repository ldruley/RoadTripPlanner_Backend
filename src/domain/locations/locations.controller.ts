import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
  UseGuards,
  Patch,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GetUser } from '../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth-guard';
import { LocationCategoryCode } from '../../common/enums';
import { GeocodeLocationDto } from './dto/geocode-location.dto';
import { DiscoverNearbyDto } from './dto/discover-nearby.dto';
import { StopsService } from '../itinerary/services/stops.service';

@ApiTags('Locations [Frontend can use Nearby and Search]')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[TESTING] Create a new location' })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  async create(
    @Body() createLocationDto: CreateLocationDto,
    @GetUser() user: User,
  ) {
    return this.locationsService.create(createLocationDto);
  }

  @Post('geocode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Geocode an address and create a location',
    description:
      'Queries the HERE API to geocode an address and creates a location in the database. Returns both the created location and the raw HERE API response.',
  })
  @ApiBody({
    type: GeocodeLocationDto,
    description: 'Geocode request data',
    examples: {
      'Basic Address': {
        value: {
          address: '123 Main St, San Francisco, CA 94105',
        },
        summary: 'Basic address with no custom name',
      },
      'Address with Custom Name': {
        value: {
          address: '123 Main St, San Francisco, CA 94105',
          name: 'My Home',
          description: 'Starting point for our trip',
        },
        summary: 'Address with custom name and description',
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Location created successfully from geocoded address',
    content: {
      'application/json': {
        example: {
          location: {
            location_id: 1,
            name: 'My Home',
            description: 'Starting point for our trip',
            address: '123 Main St, San Francisco, CA 94105',
            city: 'San Francisco',
            state: 'CA',
            postal_code: '94105',
            country: 'USA',
            latitude: 37.7929,
            longitude: -122.3971,
            external_id:
              'here:af:streetsection:FmrG0OGTwnFiOGpPeHVrQB:CggIBCDn9K-nAQ',
            external_source: 'here',
            created_by_id: 1,
            created_at: '2025-05-02T12:34:56.789Z',
            updated_at: '2025-05-02T12:34:56.789Z',
          },
          hereResponse: {
            title: '123 Main St',
            id: 'here:af:streetsection:FmrG0OGTwnFiOGpPeHVrQB:CggIBCDn9K-nAQ',
            resultType: 'street',
            address: {
              label: '123 Main St, San Francisco, CA 94105, United States',
              countryCode: 'USA',
              countryName: 'United States',
              state: 'CA',
              county: 'San Francisco',
              city: 'San Francisco',
              postalCode: '94105',
            },
            position: {
              lat: 37.7929,
              lng: -122.3971,
            },
            // Additional HERE API data...
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid address or geocoding failed',
  })
  @ApiResponse({
    status: 404,
    description: 'No locations found for the provided address',
  })
  async geocodeAddress(
    @Body() geocodeDto: GeocodeLocationDto,
    @GetUser() user: User,
  ) {
    return this.locationsService.geocodeAndCreateLocation(
      geocodeDto,
      user.user_id,
    );
  }

  @Post('discover-nearby')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Search for nearby locations using a stop or location as center point',
    description:
      'Searches for locations near a specified stop or location using the HERE API. Accepts either stop or location id but one of the two is required. Returns an array of location results with detailed information.',
  })
  @ApiBody({
    type: DiscoverNearbyDto,
    description: 'Search parameters',
    examples: {
      'Search for a specific place': {
        value: {
          query: 'Monterey Bay Aquarium',
          stopId: 1,
          limit: 10,
          radius: 100000,
        },
        summary: 'Search for a specific place',
      },
      'Search by Stop ID': {
        value: {
          query: 'restaurants',
          stopId: 1,
          limit: 10,
          radius: 5000,
        },
        summary: 'Search for restaurants near a stop (example with stop id)',
      },
      'Search by Location ID': {
        value: {
          query: 'hotels',
          locationId: 5,
          limit: 15,
          radius: 10000,
        },
        summary: 'Search for hotels near a location (example with location id)',
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Returns an array of nearby locations',
    content: {
      'application/json': {
        example: {
          locations: [
            {
              name: 'The Cheesecake Factory',
              description: 'restaurant',
              address: '251 Geary St, San Francisco, CA 94102, United States',
              city: 'San Francisco',
              state: 'CA',
              postal_code: '94102',
              country: 'USA',
              latitude: 37.7873,
              longitude: -122.4064,
              external_id:
                'here:pds:place:8409q2tt-f5d90d9e2cec487eb13d8b1183fac11b',
              external_source: 'here',
              distance: 254,
              categories: [
                {
                  id: '100-1000-0000',
                  name: 'Restaurant',
                  primary: true,
                },
              ],
            },
            // More locations...
          ],
          hereResponse: {
            items: [
              // HERE API raw response
            ],
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing required parameters or invalid input',
  })
  @ApiResponse({ status: 404, description: 'Stop or location not found' })
  async discoverNearby(@Body() discoverDto: DiscoverNearbyDto) {
    return this.locationsService.discoverNearby(discoverDto);
  }

  @Get('suggested')
  @ApiOperation({
    summary: 'Find suggested locations near a point',
    description:
      'Takes either a location id or lat/lng coordinates and returns a list of suggested locations inside the radius.',
  })
  @ApiQuery({
    name: 'lat',
    description: 'Latitude',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'lng',
    description: 'Longitude',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'locationId',
    description: 'ID of a location to use as the center point',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'radius',
    description: 'Radius in meters',
    type: Number,
    required: false,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    type: Number,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Returns nearby locations' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - missing required parameters or invalid input',
  })
  @ApiResponse({
    status: 404,
    description: 'Location not found when using locationId',
  })
  async findNearby(
    @Query('lat') latitude?: number,
    @Query('lng') longitude?: number,
    @Query('locationId', new ParseIntPipe({ optional: true }))
    locationId?: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
  ) {
    // Validate that either coordinates or locationId is provided
    if ((!latitude || !longitude) && !locationId) {
      throw new BadRequestException(
        'Either lat/lng or locationId must be provided',
      );
    }

    // If coordinates are provided, parse them
    if (latitude !== undefined && longitude !== undefined) {
      latitude = parseFloat(latitude.toString());
      longitude = parseFloat(longitude.toString());

      if (isNaN(latitude) || isNaN(longitude)) {
        throw new BadRequestException(
          'Invalid coordinates. Lat and lng must be valid numbers.',
        );
      }
    }

    return this.locationsService.findNearby(
      latitude,
      longitude,
      locationId,
      radius,
      limit,
    );
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for locations by term' })
  @ApiQuery({ name: 'term', description: 'Search term', type: String })
  @ApiQuery({
    name: 'limit',
    description: 'Maximum number of results',
    type: Number,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Returns matching locations' })
  async search(@Query('term') term: string, @Query('limit') limit?: number) {
    return this.locationsService.search(term, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a location by ID' })
  @ApiResponse({ status: 200, description: 'Returns the location' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.findById(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[TESTING] Update a location' })
  @ApiResponse({ status: 200, description: 'Location updated successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.update(id, updateLocationDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[TESTING] Delete a location' })
  @ApiResponse({ status: 200, description: 'Location deleted successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.locationsService.remove(id);
  }

  @Post(':id/rate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Rate a location' })
  @ApiResponse({ status: 200, description: 'Rating added successfully' })
  @ApiResponse({ status: 404, description: 'Location not found' })
  async rate(
    @Param('id', ParseIntPipe) id: number,
    @Body('rating', ParseIntPipe) rating: number,
  ) {
    return this.locationsService.addRating(id, rating);
  }
}
