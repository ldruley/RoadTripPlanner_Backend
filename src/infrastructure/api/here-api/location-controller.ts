import {
  BadRequestException,
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { HereApiService } from './here-api.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth-guard';

@ApiTags(
  'Here Locations [FOR TESTING - THESE WILL BE WRAPPED IN OUR OWN FUNCTIONS FOR FRONTEND TO CALL]',
)
@Controller('here-locations')
export class HereLocationController {
  constructor(private readonly hereApiService: HereApiService) {}

  @Get('geocode')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Search for locations by address, locality, or exact name',
  })
  @ApiResponse({ status: 200, description: 'Returns matching locations' })
  async geocodeLocations(
    @Query('query') query: string,
    @Query('limit', ParseIntPipe) limit: number,
  ) {
    return this.hereApiService.geocodeLocations(query, limit);
  }

  @Get('discover/by-stop')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for locations near a previous stop' })
  @ApiResponse({ status: 200, description: 'Returns matching locations' })
  @ApiResponse({ status: 404, description: 'Previous stop not found' })
  async discoverLocationsByStop(
    @Query('query') query: string,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('prevStopId', ParseIntPipe) prevStopId: number,
  ) {
    return this.hereApiService.discoverLocationsByStop(
      query,
      limit,
      prevStopId,
    );
  }

  @Get('discover/by-coordinates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Search for locations near specified coordinates' })
  @ApiResponse({ status: 200, description: 'Returns matching locations' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async discoverLocationsByCoordinates(
    @Query('query') query: string,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('lat') lat: string,
    @Query('lng') lng: string,
  ) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      throw new BadRequestException(
        'Invalid coordinates. Lat and lng must be valid numbers.',
      );
    }

    return this.hereApiService.discoverLocationsByCoordinates(
      query,
      limit,
      latitude,
      longitude,
    );
  }

  @Get('poi')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: '[Not working yet] Search for points of interest near a location',
  })
  @ApiResponse({ status: 200, description: 'Returns nearby POIs' })
  async searchPOI(
    @Query('category') category: string,
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
    @Query('limit') limit?: number,
  ) {
    return this.hereApiService.searchPOI(category, lat, lng, radius, limit);
  }
}
