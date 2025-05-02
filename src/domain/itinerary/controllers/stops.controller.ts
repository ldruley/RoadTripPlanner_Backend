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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { StopsService } from '../services/stops.service';
import { ItineraryService } from '../services/itinerary.service';
import { UpdateStopDto } from '../dto/update-stop.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';
import { CreateStopDto } from '../dto/create-stop.dto';

@ApiTags('Stops')
@Controller('stops')
export class StopsController {
  constructor(
    private readonly stopsService: StopsService,
    private readonly itineraryService: ItineraryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a stop to a stint with simple sequence numbering',
    description:
      'If sequence_number is omitted or 0, the stop will be added to the end of the sequence',
  })
  @ApiBody({
    description: 'Stop creation data',
    type: CreateStopDto,
    examples: {
      'Attraction Stop': {
        summary: 'Attraction Stop',
        description: 'Add an attraction stop to an existing stint',
        value: {
          name: 'Golden Gate Park',
          latitude: 37.7749,
          longitude: -122.4194,
          address: '501 Stanyan St, San Francisco, CA 94117',
          stop_type: 'attraction',
          duration: 180,
          notes: 'Bring hiking shoes and camera',
          trip_id: 1,
          stint_id: 1,
          city: 'San Francisco',
          state: 'CA',
          postal_code: '94117',
        },
      },
      'Overnight Stop': {
        summary: 'Overnight Stop',
        description: 'Add an overnight stop to an existing stint',
        value: {
          name: 'Monterey Bay Hotel',
          latitude: 36.6002,
          longitude: -121.8947,
          address: '123 Ocean Ave, Monterey, CA 93940',
          stop_type: 'overnight',
          duration: 720,
          notes: 'Luxury oceanfront accommodations',
          trip_id: 1,
          stint_id: 1,
          city: 'Monterey',
          state: 'CA',
          postal_code: '93940',
        },
      },
      'Gas Station Stop': {
        summary: 'Gas Station Stop',
        description: 'Add a gas station stop to an existing stint',
        value: {
          name: 'Shell Gas Station',
          latitude: 36.9741,
          longitude: -122.0308,
          address: '1003 Ocean St, Santa Cruz, CA 95060',
          stop_type: 'gas',
          duration: 15,
          notes: 'Refueling point',
          trip_id: 1,
          stint_id: 1,
          city: 'Santa Cruz',
          state: 'CA',
          postal_code: '95060',
        },
      },
      'Manual Sequence Stop': {
        summary: 'Manual Timing/Sequence Stop',
        description:
          'Add a stop to an existing stint with manual timing and sequence order',
        value: {
          name: 'Shell Gas Station',
          latitude: 36.9741,
          longitude: -122.0308,
          sequence_number: 3,
          address: '1003 Ocean St, Santa Cruz, CA 95060',
          stop_type: 'gas',
          duration: 15,
          notes: 'Refueling point',
          trip_id: 1,
          stint_id: 1,
          city: 'Santa Cruz',
          state: 'CA',
          postal_code: '95060',
        },
      },
      'Stop with location id': {
        summary: 'Stop with location id (Not yet implemented)',
        description:
          'This is how adding a stop could work if we have them search for a stop first, and get the location id from the backend',
        value: {
          location_id: 22,
          stop_type: 'attraction',
          duration: 180,
          notes: 'Bring hiking shoes and camera',
          trip_id: 1,
          stint_id: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Stop added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have permission',
  })
  addStop(@Body() createStopDto: CreateStopDto, @GetUser() user: User) {
    return this.itineraryService.addStop(createStopDto, user.user_id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stop by ID' })
  @ApiParam({ name: 'id', description: 'Stop ID' })
  @ApiResponse({ status: 200, description: 'Stop found' })
  @ApiResponse({ status: 404, description: 'Stop not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stopsService.findById(id);
  }

  /*  @Get('trip/:tripId')
  @ApiOperation({ summary: '[TESTING ONLY]: Get all stops for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Returns stops for the trip' })
  @ApiResponse({ status: 404, description: 'No stops found for the trip' })
  findByTrip(@Param('tripId', ParseIntPipe) tripId: number) {
    return this.stopsService.findAllByTrip(tripId);
  }*/

  @Get('stint/:stintId')
  @ApiOperation({ summary: '[TESTING ONLY]: Get all stops for a stint' })
  @ApiParam({ name: 'stintId', description: 'Stint ID' })
  @ApiResponse({ status: 200, description: 'Returns stops for the stint' })
  @ApiResponse({ status: 404, description: 'No stops found for the stint' })
  findByStint(@Param('stintId', ParseIntPipe) stintId: number) {
    return this.stopsService.findAllByStint(stintId);
  }

  /*  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[IN PROGRESS]: Update a stop',
    description: 'For updating stop metadata, not the sequence number',
  })
  @ApiParam({ name: 'id', description: 'Stop ID' })
  @ApiResponse({ status: 200, description: 'Stop updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have permission',
  })
  @ApiResponse({ status: 404, description: 'Stop not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStopDto: UpdateStopDto,
    @GetUser() user: User,
  ) {
    return this.stopsService.update(id, updateStopDto, user.user_id);
  }*/

  @Patch('stint/:stintId/reorder-stops')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[NEEDS UPDATING] Reorder stops within a stint',
    description:
      'Updates the sequence numbers of stops in a stint and reconstructs legs accordingly',
  })
  @ApiParam({ name: 'stintId', description: 'Stint ID' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['stopOrder'],
      properties: {
        stopOrder: {
          type: 'array',
          items: {
            type: 'object',
            required: ['stop_id', 'sequence_number'],
            properties: {
              stop_id: {
                type: 'number',
                description: 'ID of the stop',
              },
              sequence_number: {
                type: 'number',
                description: 'New sequence number for the stop',
              },
            },
          },
          description: 'Array of stops with their new sequence numbers',
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stops reordered successfully' })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have permission',
  })
  reorderStops(
    @Param('stintId', ParseIntPipe) stintId: number,
    @Body() data: { stopOrder: { stop_id: number; sequence_number: number }[] },
    @GetUser() user: User,
  ) {
    return this.itineraryService.reorderStops(
      stintId,
      data.stopOrder,
      user.user_id,
    );
  }

  @Delete(':stopId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[NEEDS UPDATING] Remove a stop and update sequence numbers',
  })
  @ApiParam({ name: 'stopId', description: 'Stop ID' })
  @ApiResponse({ status: 200, description: 'Stop removed successfully' })
  @ApiResponse({ status: 404, description: 'Stop not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have permission',
  })
  removeStop(
    @Param('stopId', ParseIntPipe) stopId: number,
    @GetUser() user: User,
  ) {
    return this.itineraryService.removeStop(stopId, user.user_id);
  }
}
