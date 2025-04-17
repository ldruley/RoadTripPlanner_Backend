import {Controller, Get, ParseIntPipe, Query, UseGuards} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HereApiService } from './here-api.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@ApiTags('locations')
@Controller('locations')
export class LocationController {
    constructor(private readonly hereApiService: HereApiService) {}

    @Get('geocode')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Search for locations by address, locality, or exact name' })
    @ApiResponse({ status: 200, description: 'Returns matching locations' })
    async geocodeLocations(
        @Query('query') query: string,
        @Query('limit', ParseIntPipe) limit: number
    ) {
        return this.hereApiService.geocodeLocations(query, limit);
    }

    @Get('discover')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Not working yet] Search for locations by query string' })
    @ApiResponse({ status: 200, description: 'Returns matching locations' })
    async discoverLocations(
        @Query('query') query: string,
        @Query('limit', ParseIntPipe) limit: number
    ) {
        return this.hereApiService.discoverLocations(query, limit);
    }

    @Get('poi')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: '[Not working yet] Search for points of interest near a location' })
    @ApiResponse({ status: 200, description: 'Returns nearby POIs' })
    async searchPOI(
        @Query('category') category: string,
        @Query('lat') lat: number,
        @Query('lng') lng: number,
        @Query('radius') radius?: number,
        @Query('limit') limit?: number
    ) {
        return this.hereApiService.searchPOI(category, lat, lng, radius, limit);
    }
}