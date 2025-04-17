import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HereApiService } from './here-api.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth-guard';

@ApiTags('routing')
@Controller('routing')
export class RoutingController {
    constructor(private readonly hereApiService: HereApiService) {
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({summary: 'Get a route between two coordinates'})
    @ApiResponse({status: 200, description: 'Returns route information'})
    @ApiResponse({status: 400, description: 'Invalid coordinates'})
    async getRoute(
        @Query('startLat') startLat: number,
        @Query('startLng') startLng: number,
        @Query('endLat') endLat: number,
        @Query('endLng') endLng: number
    ) {
        return this.hereApiService.getRoute(startLat, startLng, endLat, endLng);
    }
}