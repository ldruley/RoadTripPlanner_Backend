import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LegsService } from '../services/legs.service';

@ApiTags('Legs [TESTING]')
@Controller('legs')
export class LegsController {
  constructor(private readonly legsService: LegsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a leg by ID' })
  @ApiOperation({ summary: 'Get a leg by ID' })
  @ApiParam({ name: 'id', description: 'Leg ID' })
  @ApiResponse({ status: 200, description: 'Leg found' })
  @ApiResponse({ status: 404, description: 'Leg not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.legsService.findById(id);
  }

  @Get('stint/:stintId')
  @ApiOperation({ summary: '[FOR TESTING]: Get all legs for a stint' })
  @ApiParam({ name: 'stintId', description: 'Stint ID' })
  @ApiResponse({ status: 200, description: 'Returns legs for the stint' })
  @ApiResponse({ status: 404, description: 'No legs found for the stint' })
  findByStint(@Param('stintId', ParseIntPipe) stintId: number) {
    return this.legsService.findAllByStint(stintId);
  }

  @Get('stops/:startStopId/:endStopId')
  @ApiOperation({
    summary: '[BASIC IMPLEMENTATION]: Get a leg between two stops',
  })
  @ApiParam({ name: 'startStopId', description: 'Start Stop ID' })
  @ApiParam({ name: 'endStopId', description: 'End Stop ID' })
  @ApiResponse({ status: 200, description: 'Leg found' })
  @ApiResponse({ status: 404, description: 'Leg not found' })
  findBetweenStops(
    @Param('startStopId', ParseIntPipe) startStopId: number,
    @Param('endStopId', ParseIntPipe) endStopId: number,
  ) {
    return this.legsService.findLegBetweenStops(startStopId, endStopId);
  }
}
