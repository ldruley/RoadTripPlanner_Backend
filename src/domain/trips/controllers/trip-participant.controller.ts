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
import { TripParticipantService } from '../services/trip-participant.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../infrastructure/auth/guards/jwt-auth-guard';
import { CreateTripParticipantDto } from '../dto/create-trip-participant.dto';
import { GetUser } from '../../../infrastructure/auth/decorators/get-user-decorator';
import { User } from '../../users/entities/user.entity';
import { UpdateTripParticipantDto } from '../dto/update-trip-participant.dto';

@Controller('trips/:tripId/participants')
export class TripParticipantsController {
  constructor(
    private readonly tripParticipantService: TripParticipantService,
  ) {}

  @Get(':userId')
  @ApiOperation({ summary: 'Check if a user is participating in a trip' })
  @ApiResponse({ status: 200, description: 'User is participating' })
  @ApiResponse({ status: 404, description: 'User is not participating' })
  async checkParticipation(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('userId', ParseIntPipe) userId: number,
  ) {
    return this.tripParticipantService.getParticipant(tripId, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all participants of a trip' })
  @ApiResponse({ status: 200, description: 'List of participants' })
  @ApiResponse({ status: 404, description: 'Trip not found' })
  async findAll(@Param('tripId', ParseIntPipe) tripId: number) {
    return this.tripParticipantService.findByTrip(tripId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a participant to a trip' })
  @ApiResponse({ status: 201, description: 'Participant added successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - user already participating',
  })
  async addParticipant(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Body() createParticipantDto: CreateTripParticipantDto,
    @GetUser() user: User,
  ) {
    // Ensure the tripId from path matches the DTO
    createParticipantDto.trip_id = tripId;
    return this.tripParticipantService.addParticipant(
      createParticipantDto,
      user.user_id,
    );
  }

  @Patch(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a participant's role" })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async updateRole(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateRoleDto: UpdateTripParticipantDto,
    @GetUser() user: User,
  ) {
    return this.tripParticipantService.updateRole(
      tripId,
      userId,
      updateRoleDto.role,
      user.user_id,
    );
  }

  @Delete(':userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a participant from a trip' })
  @ApiResponse({ status: 200, description: 'Participant removed successfully' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - insufficient permissions',
  })
  @ApiResponse({ status: 404, description: 'Participant not found' })
  async removeParticipant(
    @Param('tripId', ParseIntPipe) tripId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @GetUser() user: User,
  ) {
    return this.tripParticipantService.removeParticipant(
      tripId,
      userId,
      user.user_id,
    );
  }
}
