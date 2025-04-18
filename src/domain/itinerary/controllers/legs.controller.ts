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
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { LegsService } from '../services/legs.service';
import { CreateLegDto } from '../dto/create-leg.dto';
import { UpdateLegDto } from '../dto/update-leg.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';

@ApiTags('Legs')
@Controller('legs')
export class LegsController {
  constructor(private readonly legsService: LegsService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get a leg by ID' })
  @ApiParam({ name: 'id', description: 'Leg ID' })
  @ApiResponse({ status: 200, description: 'Leg found' })
  @ApiResponse({ status: 404, description: 'Leg not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.legsService.findOne(id);
  }

  @Get('stint/:stintId')
  @ApiOperation({ summary: 'Get all legs for a stint' })
  @ApiParam({ name: 'stintId', description: 'Stint ID' })
  @ApiResponse({ status: 200, description: 'Returns legs for the stint' })
  @ApiResponse({ status: 404, description: 'No legs found for the stint' })
  findByStint(@Param('stintId', ParseIntPipe) stintId: number) {
    return this.legsService.findAllByStint(stintId);
  }

  @Get('stops/:startStopId/:endStopId')
  @ApiOperation({ summary: 'Get a leg between two stops' })
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
