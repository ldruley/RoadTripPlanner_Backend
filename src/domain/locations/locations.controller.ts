import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  ParseIntPipe,
  ParseFloatPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LocationsService } from './locations.service';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { GetUser } from '../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../users/entities/user.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth-guard';
import { LocationType } from './entities/location.entity';

@ApiTags('Locations')
@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new location' })
  @ApiResponse({ status: 201, description: 'Location created successfully' })
  async create(
    @Body() createLocationDto: CreateLocationDto,
    @GetUser() user: User,
  ) {
    return this.locationsService.create(createLocationDto, user.user_id);
  }

  @Get('nearby')
  @ApiOperation({ summary: 'Find locations near a point' })
  @ApiQuery({ name: 'lat', description: 'Latitude', type: Number })
  @ApiQuery({ name: 'lng', description: 'Longitude', type: Number })
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
  @ApiQuery({
    name: 'type',
    description: 'Location type filter',
    enum: LocationType,
    required: false,
  })
  @ApiResponse({ status: 200, description: 'Returns nearby locations' })
  async findNearby(
    @Query('lat', ParseFloatPipe) latitude: number,
    @Query('lng', ParseFloatPipe) longitude: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
    @Query('type') locationType?: LocationType,
  ) {
    return this.locationsService.findNearby(
      latitude,
      longitude,
      radius,
      limit,
      locationType,
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

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a location' })
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
  @ApiOperation({ summary: 'Delete a location' })
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
