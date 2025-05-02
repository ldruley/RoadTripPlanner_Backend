import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { TripsService } from '../services/trips.service';
import { UpdateTripDto } from '../dto/update-trip-dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateTripDto } from '../dto/create-trip.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';
import { ItineraryService } from '../../itinerary/services/itinerary.service';

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly itineraryService: ItineraryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new trip' })
  @ApiBody({
    description: 'Trip creation data',
    type: 'CreateTripDto',
    examples: {
      example1: {
        summary: 'Basic Trip',
        description: 'Create a basic trip with minimal information',
        value: {
          title: 'West Coast Trip',
          description: 'Driving up highway 1',
          is_public: false,
        },
      },
      example2: {
        summary: 'Full Trip',
        description: 'Create a trip with all available fields',
        value: {
          title: 'West Coast Adventure',
          description: 'Exploring the California coast',
          start_date: '2025-05-15',
          end_date: '2025-05-30',
          is_public: true,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Trip successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  create(@Body() createTripDto: CreateTripDto, @GetUser() user: User) {
    return this.tripsService.create({
      ...createTripDto,
      creator_id: user.user_id,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a trip by ID' })
  @ApiResponse({
    status: 200,
    description: 'Trip id found',
    content: {
      'application/json': {
        example: {
          trip_id: 1,
          title: 'West Coast Adventure',
          description: 'A journey along the California coast',
          start_date: '2025-05-15T00:00:00Z',
          end_date: '2025-05-30T00:00:00Z',
          total_distance: 850.5,
          is_public: false,
          created_at: '2025-04-27T21:15:16.830Z',
          updated_at: '2025-04-27T21:15:16.830Z',
          creator_id: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.tripsService.findOne(id);
  }

  @Get(':id/timeline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      '[IN PROGRESS - MOSTLY WORKING]: Get complete trip timeline with all details',
    description:
      'This still needs a few updates, but implementation is mostly in place',
  })
  @ApiResponse({
    status: 200,
    description: 'Trip timeline retrieved successfully',
    content: {
      'application/json': {
        example: {
          trip_id: 1,
          title: 'West Coast Adventure',
          description: 'A journey along the California coast',
          start_date: '2025-05-15T00:00:00Z',
          end_date: '2025-05-30T00:00:00Z',
          total_distance: 850.5,
          total_duration: 2880,
          stints: [
            {
              stint_id: 1,
              name: 'California Coast Drive',
              sequence_number: 1,
              distance: 350.5,
              estimated_duration: 480,
              notes: 'Scenic coastal route',
              start_time: '2025-05-15T08:00:00Z',
              end_time: '2025-05-16T17:00:00Z',
              continues_from_previous: false,
              start_location_name: 'San Francisco',
              end_location_name: 'Monterey',
              timeline: [
                {
                  type: 'departure',
                  sequence_number: 0,
                  item: {
                    stop_id: 0,
                    name: 'San Francisco',
                    latitude: 37.7749,
                    longitude: -122.4194,
                    address: '123 Main St, San Francisco, CA',
                    stop_type: 'departure',
                    arrival_time: '2025-05-15T08:00:00Z',
                    departure_time: '2025-05-15T08:00:00Z',
                    duration: 0,
                    sequence_number: 0,
                    notes: 'Departure from San Francisco',
                  },
                },
                {
                  type: 'leg',
                  sequence_number: 0.5,
                  item: {
                    leg_id: 1,
                    distance: 50.2,
                    estimated_travel_time: 60,
                    route_type: 'highway',
                    notes: 'Take Highway 101 South',
                    start_stop_name: 'San Francisco',
                    end_stop_name: 'Half Moon Bay',
                  },
                },
                {
                  type: 'stop',
                  sequence_number: 1,
                  item: {
                    stop_id: 1,
                    name: 'Half Moon Bay',
                    latitude: 37.4636,
                    longitude: -122.4286,
                    address: '123 Beach St, Half Moon Bay, CA',
                    stop_type: 'attraction',
                    arrival_time: '2025-05-15T09:00:00Z',
                    departure_time: '2025-05-15T11:00:00Z',
                    duration: 120,
                    sequence_number: 1,
                    notes: 'Beautiful coastal town',
                  },
                },
                {
                  type: 'leg',
                  sequence_number: 1.5,
                  item: {
                    leg_id: 2,
                    distance: 100.3,
                    estimated_travel_time: 120,
                    route_type: 'highway',
                    notes: 'Continue on Highway 1 South',
                    start_stop_name: 'Half Moon Bay',
                    end_stop_name: 'Santa Cruz',
                  },
                },
                {
                  type: 'stop',
                  sequence_number: 2,
                  item: {
                    stop_id: 2,
                    name: 'Santa Cruz Boardwalk',
                    latitude: 36.9641,
                    longitude: -122.0177,
                    address: '400 Beach St, Santa Cruz, CA',
                    stop_type: 'attraction',
                    arrival_time: '2025-05-15T13:00:00Z',
                    departure_time: '2025-05-15T17:00:00Z',
                    duration: 240,
                    sequence_number: 2,
                    notes: 'Enjoy the beach and boardwalk',
                  },
                },
              ],
            },
          ],
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Trip not found or no stints found',
  })
  getTimeline(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.itineraryService.getTripTimeline(id, user.user_id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get trips by authenticated user' })
  @ApiResponse({ status: 200, description: 'Trips found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'No trips found' })
  findByAuthenticatedUser(@GetUser() user: User) {
    return this.tripsService.findByCreator(user.user_id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update a trip',
    description:
      'This is only for updating Trip metadata - name, description, start_date, public, etc',
  })
  @ApiResponse({ status: 200, description: 'Trip updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTripDto: UpdateTripDto,
    @GetUser() user: User,
  ) {
    return this.tripsService.update(id, updateTripDto, user.user_id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a trip' })
  @ApiResponse({ status: 200, description: 'Trip deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.tripsService.remove(id, user.user_id);
  }
}
