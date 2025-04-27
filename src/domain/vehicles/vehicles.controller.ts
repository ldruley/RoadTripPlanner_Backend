import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt-auth-guard';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { CreateVehicleDto } from './dto/create-vehicle-dto';
import { GetUser } from '../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../users/entities/user.entity';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new vehicle' })
  @ApiResponse({ status: 201, description: 'Vehicle successfully created' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiBody({
    description: 'Vehicle creation data',
    type: CreateVehicleDto,
    examples: {
      'Standard Car': {
        summary: 'Standard Car',
        description: 'Create a standard passenger car',
        value: {
          name: 'Toyota Camry',
          year: 2022,
          fuel_capacity: 15.8,
          mpg: 28.5,
        },
      },
      SUV: {
        summary: 'SUV',
        description: 'Create an SUV with lower fuel economy',
        value: {
          name: 'Ford Explorer',
          year: 2023,
          fuel_capacity: 20.2,
          mpg: 21.0,
        },
      },
    },
  })
  create(@Body() createVehicleDto: CreateVehicleDto, @GetUser() user: User) {
    return this.vehiclesService.create({
      ...createVehicleDto,
      owner_id: user.user_id,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a vehicle by ID' })
  @ApiResponse({
    status: 200,
    description: 'Details of the vehicle with the given ID',
    content: {
      'application/json': {
        example: {
          id: 1,
          name: 'Toyota Camry',
          year: 2022,
          fuel_capacity: 15.8,
          mpg: 28.5,
          owner_id: 1,
        },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.findOne(id);
  }

  @Get('owner/:ownerId')
  @ApiOperation({ summary: 'Get vehicles by owner ID' })
  @ApiResponse({ status: 200, description: 'Vehicles found' })
  @ApiResponse({ status: 404, description: 'Vehicles not found' })
  findByOwner(@Param('ownerId', ParseIntPipe) ownerId: number) {
    return this.vehiclesService.findByOwner(ownerId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vehicles by authenticated user' })
  @ApiResponse({ status: 200, description: 'Vehicles found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  findByAuthenticatedUser(@GetUser() user: User) {
    return this.vehiclesService.findByOwner(user.user_id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[BASIC IMPLEMENTATION]: Update a vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Vehicle not found' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVehicleDto: CreateVehicleDto,
    @GetUser() user: User,
  ) {
    return this.vehiclesService.update(id, updateVehicleDto, user.user_id);
  }
}
