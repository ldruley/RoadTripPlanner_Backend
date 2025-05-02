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
import { TripSuppliesService } from '../services/trip-supplies.service';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';
import { CreateTripSupplyDto } from '../dto/create-trip-supply.dto';
import { UpdateTripSupplyDto } from '../dto/update-trip-supply.dto';
import { SupplyCategory } from '../../../common/enums';

@ApiTags('Trip Supplies')
@Controller('trips/:tripId/supplies')
export class TripSuppliesController {
  constructor(private readonly tripSuppliesService: TripSuppliesService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all supplies for a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({ status: 200, description: 'Returns supplies for the trip' })
  async getTripSupplies(@Param('tripId', ParseIntPipe) tripId: number) {
    return this.tripSuppliesService.getTripSupplies(tripId);
  }

  @Get('by-category')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all supplies for a trip, grouped by category',
    description:
      'Returns an object with categories as keys and arrays of supplies as values',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns supplies grouped by category',
    content: {
      'application/json': {
        example: {
          gear: [
            {
              supply_id: 1,
              name: '4-person tent',
              category: 'gear',
              quantity: 1,
              notes: 'Main family tent',
              created_at: '2023-10-01T12:00:00Z',
            },
            {
              supply_id: 2,
              name: 'Sleeping bag',
              category: 'gear',
              quantity: 4,
              notes: null,
              created_at: '2023-10-02T15:30:00Z',
            },
          ],
          food: [
            {
              supply_id: 3,
              name: 'Trail mix (5 packs)',
              category: 'food',
              quantity: 2,
              notes: 'For hiking days',
              created_at: '2023-10-03T09:00:00Z',
            },
          ],
        },
      },
    },
  })
  async getTripSuppliesByCategory(
    @Param('tripId', ParseIntPipe) tripId: number,
  ) {
    return this.tripSuppliesService.getTripSuppliesByCategory(tripId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Add a supply to a trip',
    description:
      'Add an existing supply or create a new one and add it to the trip',
  })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiBody({
    description: 'Supply addition data',
    type: CreateTripSupplyDto,
    examples: {
      'Add Existing Supply': {
        summary: 'Add Existing Supply',
        description: 'Add an existing supply to the trip',
        value: {
          trip_id: 1,
          supply_id: 5,
          quantity: 2,
          notes: 'One for each tent',
        },
      },
      'Create and Add New Supply': {
        summary: 'Create and Add New Supply',
        description: 'Create a new supply and add it to the trip',
        value: {
          trip_id: 1,
          quantity: 1,
          notes: 'Main cooking equipment',
          new_supply: {
            name: 'Camping Stove',
            category: SupplyCategory.GEAR,
          },
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Supply added successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Supply already exists in trip',
  })
  async addSupplyToTrip(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() createTripSupplyDto: CreateTripSupplyDto,
    @GetUser() user: User,
  ) {
    // Ensure the tripId from path matches the DTO
    createTripSupplyDto.trip_id = tripId;
    return this.tripSuppliesService.addSupplyToTrip(
      createTripSupplyDto,
      user.user_id,
    );
  }

  @Patch(':supplyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a supply in a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'supplyId', description: 'Supply ID' })
  @ApiBody({
    description: 'Supply update data',
    type: UpdateTripSupplyDto,
    examples: {
      'Update Quantity and Notes': {
        summary: 'Update Quantity and Notes',
        description: 'Update the quantity and notes for a supply in a trip',
        value: {
          quantity: 3,
          notes: 'One per person plus a spare',
        },
      },
      'Update Quantity Only': {
        summary: 'Update Quantity Only',
        description: 'Update only the quantity for a supply in a trip',
        value: {
          quantity: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Supply updated successfully' })
  @ApiResponse({ status: 404, description: 'Supply not found in trip' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission',
  })
  async updateTripSupply(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('supplyId', ParseIntPipe) supplyId: number,
    @Body() updateTripSupplyDto: UpdateTripSupplyDto,
    @GetUser() user: User,
  ) {
    return this.tripSuppliesService.updateTripSupply(
      tripId,
      supplyId,
      updateTripSupplyDto,
      user.user_id,
    );
  }

  @Delete(':supplyId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a supply from a trip' })
  @ApiParam({ name: 'tripId', description: 'Trip ID' })
  @ApiParam({ name: 'supplyId', description: 'Supply ID' })
  @ApiResponse({ status: 200, description: 'Supply removed successfully' })
  @ApiResponse({ status: 404, description: 'Supply not found in trip' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not have permission',
  })
  async removeTripSupply(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('supplyId', ParseIntPipe) supplyId: number,
    @GetUser() user: User,
  ) {
    return this.tripSuppliesService.removeTripSupply(
      tripId,
      supplyId,
      user.user_id,
    );
  }
}
