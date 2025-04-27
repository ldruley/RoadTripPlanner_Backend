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
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateStintDto } from '../dto/create-stint-dto';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';
import { StintsService } from '../services/stints.service';
import { ItineraryService } from '../services/itinerary.service';
import { CreateStintWithStopDto } from '../dto/create-stint-with-stop.dto';
import { CreateStintWithOptionalStopDto } from '../dto/create-sprint-with-optional-stop.dto';

@Controller('stints')
export class StintsController {
  constructor(
    private readonly stintsService: StintsService,
    private readonly itineraryService: ItineraryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Create a stint - automatically handles initial or subsequent stints',
    description:
      'For the first stint, requires an initial stop & start time. For subsequent stints, no initial stop is needed. If sequence number is not provided, uses next available number.',
  })
  @ApiBody({
    description: 'Stint creation data',
    type: CreateStintWithOptionalStopDto,
    examples: {
      'First Stint with Initial Stop': {
        summary: 'First Stint with Initial Stop',
        description:
          'Create the first stint with an initial departure location. Start time is mandatory and departure information, only in this case',
        value: {
          name: 'California Coast Drive',
          trip_id: 1,
          initialStop: {
            name: 'San Francisco',
            latitude: 37.7749,
            longitude: -122.4194,
            address: '123 Main St, San Francisco, CA',
            stopType: 'DEPARTURE',
            notes: 'Our journey begins here',
          },
          notes: 'Scenic coastal route with stops at major viewpoints',
          start_time: '2025-05-15T08:00:00Z',
        },
      },
      'First stint with location id (Not yet implemented)': {
        summary: 'First stint with location id (Not yet implemented)',
        description:
          'This is an example of how it could work when we have users search for an address, place name, or suggested stop - we can pass the location id instead of the full details',
        value: {
          name: 'California Coast Drive',
          trip_id: 1,
          initialStop: {
            location_id: 22,
          },
          notes: 'Scenic coastal route with stops at major viewpoints',
          start_time: '2025-05-15T08:00:00Z',
        },
      },
      'All Other Stints': {
        summary: 'All Other Stints',
        description:
          'Create a stint that continues from a previous stint. Sequence number is optional (defaults to next available number)',
        value: {
          name: 'Sierra Nevada Mountains',
          sequence_number: 2,
          trip_id: 1,
          notes: 'Mountain roads with beautiful vistas',
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Stint successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(
    @Body() createStintWithOptionalStopDto: CreateStintWithOptionalStopDto,
    @GetUser() user: User,
  ) {
    return this.itineraryService.createStint(
      createStintWithOptionalStopDto,
      user.user_id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stint by ID' })
  @ApiResponse({
    status: 200,
    description: 'Stint found',
    content: {
      'application/json': {
        example: {
          stint_id: 1,
          sequence_number: 1,
          name: 'California Coast Drive',
          distance: 350.5,
          estimated_duration: 120,
          start_time: '2025-05-15T08:00:00Z',
          end_time: '2025-05-15T10:00:00Z',
          continues_from_previous: false,
          notes: 'Scenic coastal route with stops at major viewpoints',
          created_at: '2025-05-01T12:00:00Z',
          updated_at: '2025-05-01T12:00:00Z',
          trip_id: 1,
          start_location_id: 42,
          end_location_id: 43,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  findOne(@Param('id') id: number) {
    return this.stintsService.findById(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '[IN PROGRESS - NEEDS UPDATING]: Update a stint',
    description: 'For updating stint metadata, not the sequence number',
  })
  @ApiResponse({ status: 200, description: 'Stint updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStintDto: CreateStintDto,
    @GetUser() user: User,
  ) {
    return this.stintsService.update(id, updateStintDto, user.user_id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[IN PROGRESS - NEEDS UPDATING]: Delete a stint' })
  @ApiResponse({ status: 200, description: 'Stint deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.stintsService.remove(id, user.user_id);
  }
}
