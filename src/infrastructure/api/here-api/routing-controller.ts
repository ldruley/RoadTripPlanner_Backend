import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiBody,
} from '@nestjs/swagger';
import { HereApiService } from './here-api.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth-guard';

@ApiTags('Routing [FOR TESTING - THIS WILL BE A BACKEND TASK]')
@Controller('routing')
export class RoutingController {
  constructor(private readonly hereApiService: HereApiService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a route between two coordinates' })
  @ApiResponse({ status: 200, description: 'Returns route information' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async getRoute(
    @Query('startLat') startLat: number,
    @Query('startLng') startLng: number,
    @Query('endLat') endLat: number,
    @Query('endLng') endLng: number,
  ) {
    return this.hereApiService.getRoute(startLat, startLng, endLat, endLng);
  }

  @Post('waypoints')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Not for frontend use (testing): Get a route with multiple waypoints for a stint',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['startLat', 'startLng', 'endLat', 'endLng'],
      properties: {
        startLat: {
          type: 'number',
          description: 'Starting latitude',
        },
        startLng: {
          type: 'number',
          description: 'Starting longitude',
        },
        waypoints: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              lat: { type: 'number' },
              lng: { type: 'number' },
            },
          },
          description: 'Array of waypoints with lat/lng coordinates',
        },
        endLat: {
          type: 'number',
          description: 'Ending latitude',
        },
        endLng: {
          type: 'number',
          description: 'Ending longitude',
        },
      },
    },
    examples: {
      'Basic Route': {
        value: {
          startLat: 37.7749,
          startLng: -122.4194,
          waypoints: [
            { lat: 37.3382, lng: -121.8863 },
            { lat: 36.9741, lng: -122.0308 },
          ],
          endLat: 36.6002,
          endLng: -121.8947,
        },
        summary:
          'Route from San Francisco to Monterey via San Jose and Santa Cruz',
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Returns route information' })
  @ApiResponse({ status: 400, description: 'Invalid coordinates' })
  async getRouteWithWaypoints(
    @Body()
    routeData: {
      startLat: number;
      startLng: number;
      waypoints: { lat: number; lng: number }[];
      endLat: number;
      endLng: number;
    },
  ) {
    return this.hereApiService.getRouteWithWaypoints(
      routeData.startLat,
      routeData.startLng,
      routeData.waypoints,
      routeData.endLat,
      routeData.endLng,
    );
  }
}
