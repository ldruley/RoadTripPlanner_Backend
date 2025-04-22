import {
  Controller,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ItineraryService } from '../services/itinerary.service';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';

@ApiTags('Itinerary [TESTING]')
@Controller('itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Post('stint/:stintId/update-distance')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'TESTING ONLY - WILL NOT BE IN PROD - Calculate and update the total distance for a stint',
  })
  @ApiParam({ name: 'stintId', description: 'Stint ID' })
  @ApiResponse({
    status: 200,
    description: 'Stint distance updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  updateStintDistance(@Param('stintId', ParseIntPipe) stintId: number) {
    return this.itineraryService.updateStintDistance(stintId);
  }

  @Post('stint/:stintId/update-duration')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'TESTING ONLY - WILL NOT BE IN PROD - Calculate and update the total duration for a stint',
  })
  @ApiParam({ name: 'stintId', description: 'Stint ID' })
  @ApiResponse({
    status: 200,
    description: 'Stint duration updated successfully',
  })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  updateStintDuration(@Param('stintId', ParseIntPipe) stintId: number) {
    return this.itineraryService.updateStintDuration(stintId);
  }
}
