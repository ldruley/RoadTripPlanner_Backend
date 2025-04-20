import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  //Post,
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
import { StopsService } from '../services/stops.service';
//import { CreateStopDto } from '../dto/create-stop.dto';
import { UpdateStopDto } from '../dto/update-stop.dto';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';

@ApiTags('Stops')
@Controller('stops')
export class StopsController {
  constructor(private readonly stopsService: StopsService) {}

  /*  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[FOR TESTING]: Create a new stop' })
  @ApiResponse({ status: 201, description: 'Stop successfully created' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have permission',
  })
  create(@Body() createStopDto: CreateStopDto, @GetUser() user: User) {
    return this.stopsService.create(createStopDto, user.user_id);
  }*/

  @Get(':id')
  @ApiOperation({ summary: 'Get a stop by ID' })
  @ApiParam({ name: 'id', description: 'Stop ID' })
  @ApiResponse({ status: 200, description: 'Stop found' })
  @ApiResponse({ status: 404, description: 'Stop not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.stopsService.findOne(id);
  }

  @Get('trip/:tripId')
  @ApiOperation({ summary: '[FOR TESTING]: Get all stops for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Returns stops for the trip' })
  @ApiResponse({ status: 404, description: 'No stops found for the trip' })
  findByTrip(@Param('tripId', ParseIntPipe) tripId: number) {
    return this.stopsService.findAllByTrip(tripId);
  }

  @Get('stint/:stintId')
  @ApiOperation({ summary: '[FOR TESTING]: Get all stops for a stint' })
  @ApiParam({ name: 'stintId', description: 'Stint ID' })
  @ApiResponse({ status: 200, description: 'Returns stops for the stint' })
  @ApiResponse({ status: 404, description: 'No stops found for the stint' })
  findByStint(@Param('stintId', ParseIntPipe) stintId: number) {
    return this.stopsService.findAllByStint(stintId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[NOT UPDATED]: Update a stop' })
  @ApiParam({ name: 'id', description: 'Stop ID' })
  @ApiResponse({ status: 200, description: 'Stop updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - invalid input' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have permission',
  })
  @ApiResponse({ status: 404, description: 'Stop not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateStopDto: UpdateStopDto,
    @GetUser() user: User,
  ) {
    return this.stopsService.update(id, updateStopDto, user.user_id);
  }

  /*@Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[BASIC IMPLEMENTATION]: Delete a stop' })
  @ApiParam({ name: 'id', description: 'Stop ID' })
  @ApiResponse({ status: 200, description: 'Stop deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - user does not have permission',
  })
  @ApiResponse({ status: 404, description: 'Stop not found' })
  remove(@Param('id', ParseIntPipe) id: number, @GetUser() user: User) {
    return this.stopsService.remove(id, user.user_id);
  }*/
}
