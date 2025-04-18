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
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateTripDto } from './dto/create-trip.dto';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth-guard';
import { GetUser } from '../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../users/entities/user.entity';
import { StintsService } from '../Itinerary/services/stints.service';

@Controller('trips')
export class TripsController {
  constructor(
    private readonly tripsService: TripsService,
    private readonly stintsService: StintsService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new trip' })
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

  @Get(':id/stints')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all stints for a trip' })
  @ApiResponse({ status: 200, description: 'Returns stints for the trip' })
  @ApiResponse({ status: 404, description: 'Trip not found or no stints' })
  findTripStints(@Param('id', ParseIntPipe) id: number) {
    return this.stintsService.findAllByTrip(id);
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
  @ApiOperation({ summary: 'Update a trip' })
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
