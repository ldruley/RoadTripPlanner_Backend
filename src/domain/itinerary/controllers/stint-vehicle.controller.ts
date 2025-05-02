import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StintVehicleService } from '../services/stint-vehicle.service';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';
import { CreateStintVehicleDto } from '../dto/create-stint-vehicle.dto';
import { UpdateStintVehicleDto } from '../dto/update-stint-vehicle.dto';

@ApiTags('Stint Vehicles')
@Controller('stints/:stintId/vehicles')
export class StintVehicleController {
  constructor(private readonly stintVehicleService: StintVehicleService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all vehicles assigned to a stint' })
  @ApiResponse({ status: 200, description: 'List of assigned vehicles' })
  async findAll(@Param('stintId', ParseIntPipe) stintId: number) {
    return this.stintVehicleService.findByStint(stintId);
  }

  @Get(':vehicleId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Check if a vehicle is assigned to a stint' })
  @ApiResponse({ status: 200, description: 'Vehicle is assigned' })
  @ApiResponse({ status: 404, description: 'Vehicle is not assigned' })
  async checkVehicleAssignment(
    @Param('stintId', ParseIntPipe) stintId: number,
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
  ) {
    return this.stintVehicleService.isVehicleAssigned(stintId, vehicleId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign a vehicle to a stint' })
  @ApiResponse({ status: 201, description: 'Vehicle assigned successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - vehicle already assigned',
  })
  async assignVehicle(
    @Param('stintId', ParseIntPipe) stintId: number,
    @Body() createStintVehicleDto: CreateStintVehicleDto,
    @GetUser() requester: User,
  ) {
    return this.stintVehicleService.assignVehicle(
      createStintVehicleDto,
      requester.user_id,
    );
  }

  @Patch(':vehicleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update driver assignment for a stint' })
  @ApiResponse({ status: 200, description: 'Vehicle assignment updated' })
  @ApiResponse({ status: 404, description: 'Vehicle assignment not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - vehicle already assigned',
  })
  async updateVehicleAssignment(
    @Body() updateStintVehicleDto: UpdateStintVehicleDto,
    @GetUser() requester: User,
  ) {
    return this.stintVehicleService.updateDriver(
      updateStintVehicleDto,
      requester.user_id,
    );
  }

  @Delete(':vehicleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove vehicle assignment from a stint' })
  @ApiResponse({ status: 200, description: 'Vehicle assignment removed' })
  @ApiResponse({ status: 404, description: 'Vehicle assignment not found' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  async removeVehicleAssignment(
    @Param('stintId', ParseIntPipe) stintId: number,
    @Param('vehicleId', ParseIntPipe) vehicleId: number,
    @GetUser() requester: User,
  ) {
    return this.stintVehicleService.removeVehicle(
      stintId,
      vehicleId,
      requester.user_id,
    );
  }
}
