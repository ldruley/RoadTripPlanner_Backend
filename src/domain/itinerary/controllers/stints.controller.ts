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
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CreateStintDto } from '../dto/create-stint-dto';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';
import { StintsService } from '../services/stints.service';
import { ItineraryService } from '../services/itinerary.service';
import { CreateStintWithStopDto } from '../dto/create-stint-with-stop.dto';
import { CreateStintWithOptionalStopDto } from '../dto/create-sprint-with-optional-stop.dto';

@Controller('stints')
export class StintsController {
  constructor(
    private readonly stintsService: StintsService,
    private readonly itineraryService: ItineraryService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Create a stint - automatically handles initial or subsequent stints',
    description:
      'For the first stint, requires an initial stop. For subsequent stints, uses the last stop of the previous stint.',
  })
  async create(
    @Body() createStintWithOptionalStopDto: CreateStintWithOptionalStopDto,
    @GetUser() user: User,
  ) {
    return this.itineraryService.createStint(
      createStintWithOptionalStopDto,
      user.user_id,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a stint by ID' })
  @ApiResponse({ status: 200, description: 'Stint found' })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  findOne(@Param('id') id: number) {
    return this.stintsService.findById(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: '[IN PROGRESS - NEEDS UPDATING]: Update a stint',
    description: 'For updating stint metadata, not the sequence number',
  })
  @ApiResponse({ status: 200, description: 'Stint updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStintDto: CreateStintDto,
    @GetUser() user: User,
  ) {
    return this.stintsService.update(id, updateStintDto, user.user_id);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: '[IN PROGRESS - NEEDS UPDATING]: Delete a stint' })
  @ApiResponse({ status: 200, description: 'Stint deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Stint not found' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.stintsService.remove(id, user.user_id);
  }
}
