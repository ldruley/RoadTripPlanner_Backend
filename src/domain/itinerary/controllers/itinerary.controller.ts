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
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ItineraryService } from '../services/itinerary.service';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';
import { CreateStopDto } from '../dto/create-stop.dto';

//currently these endpoints are for testing. most of this functionality will be contained within the backend once we integrate with front end
@ApiTags('Itinerary')
@Controller('itinerary')
export class ItineraryController {
  constructor(private readonly itineraryService: ItineraryService) {}

  @Get('trip/:tripId/timeline')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'TEST VERSION: Get a complete trip timeline including all stints, stops and legs',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the complete trip timeline',
  })
  @ApiResponse({
    status: 404,
    description: 'Trip not found or no stints found',
  })
  getTripTimeline(
    @Param('tripId', ParseIntPipe) tripId: number,
    @GetUser() user: User,
  ) {
    return this.itineraryService.getTripTimeline(tripId, user.user_id);
  }

  @Post('stops')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a stop to a stint with simple sequence numbering',
    description:
      'If sequence_number is omitted or 0, the stop will be added to the end of the sequence',
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

  @Put('stint/:stintId/reorder-stops')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reorder stops within a stint',
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

  @Delete('stops/:stopId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Remove a stop and update sequence numbers',
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
