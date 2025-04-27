import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { TripsService } from './trips.service';
import { UpdateTripDto } from './dto/update-trip-dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateTripDto } from './dto/create-trip.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth-guard';
import { GetUser } from '../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../users/entities/user.entity';
import { ItineraryService } from '../itinerary/services/itinerary.service';

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
    type: CreateTripDto,
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
  @ApiResponse({ status: 200, description: 'Trip found' })
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
    description: 'Returns the complete trip timeline',
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

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[IN PROGRESS - NEEDS UPDATING]: Update a trip',
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
  @ApiOperation({ summary: '[IN PROGRESS - NEEDS UPDATING] Delete a trip' })
  @ApiResponse({ status: 200, description: 'Trip deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.tripsService.remove(id, user.user_id);
  }
}
