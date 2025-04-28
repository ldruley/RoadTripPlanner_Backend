//TODO: We need to ensure that a creator can not be removed from a trip + cannot have role changed
// and is set by default as creator

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { ParticipantRole } from '../../../common/enums';
import { UsersService } from '../../users/users.service';
import { CreateTripParticipantDto } from '../dto/create-trip-participant.dto';
import { UpdateTripParticipantDto } from '../dto/update-trip-participant.dto';
import { EntityManager, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as Console from 'node:console';
import { TripParticipant } from '../entities/trip-participant.entity';
import { TripsService } from './trips.service';
import { BaseService } from '../../../common/services/base.service';

@Injectable()
export class TripParticipantService extends BaseService<TripParticipant> {
  constructor(
    @InjectRepository(TripParticipant)
    repo: Repository<TripParticipant>,
    private readonly tripsService: TripsService,
    private readonly usersService: UsersService,
  ) {
    super(TripParticipant, repo);
  }

  async getParticipant(
    tripId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<TripParticipant> {
    return this.findOneOrThrow({ trip_id: tripId, user_id: userId }, manager);
  }

  async addParticipant(
    createTripParticipantDto: CreateTripParticipantDto,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<TripParticipant> {
    const repo = this.getRepo(manager);

    // Check if the trip exists
    const trip = await this.tripsService.findOne(
      createTripParticipantDto.trip_id,
      manager,
    );
    // Check if requester has permission (is creator of the trip)
    if (trip.creator_id !== requesterId) {
      throw new ForbiddenException(
        'Only the trip creator can add participants',
      );
    }

    // Check if the user exists
    const user = await this.usersService.findOne(
      createTripParticipantDto.user_id,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if the user is already a participant
    const existingParticipant = await this.checkParticipation(
      createTripParticipantDto.trip_id,
      createTripParticipantDto.user_id,
      manager,
    );
    if (existingParticipant) {
      throw new ConflictException('User is already a participant in this trip');
    }

    // Create a new participant
    const participant = repo.create(createTripParticipantDto);

    return repo.save(participant);
  }

  async findByTrip(
    stintId: number,
    manager?: EntityManager,
  ): Promise<TripParticipant[]> {
    return this.findAll({ trip_id: stintId }, manager);
  }

  async findByUser(
    userId: number,
    manager?: EntityManager,
  ): Promise<TripParticipant[]> {
    return this.findAll({ user_id: userId }, manager);
  }

  //TODO: Use a DTO for this if we can
  async updateRole(
    tripId: number,
    userId: number,
    newRole: ParticipantRole,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<TripParticipant> {
    const repo = this.getRepo(manager);
    // Check if the trip exists
    const trip = await this.tripsService.findOne(tripId, manager);

    // Check if requester has permission
    if (trip.creator_id !== requesterId) {
      throw new ForbiddenException(
        'Only the trip creator can update participant roles',
      );
    }

    // Find the participant
    const participant = await this.getParticipant(tripId, userId, manager);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Update role
    participant.role = newRole;
    return repo.save(participant);
  }

  async removeParticipant(
    tripId: number,
    userId: number,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<void> {
    // Check if the stint exists
    const trip = await this.tripsService.findOne(tripId, manager);
    const repo = this.getRepo(manager);

    // Check if requester has permission or is removing themselves
    if (trip.creator_id !== requesterId && userId !== requesterId) {
      throw new ForbiddenException(
        'Only the trip creator or the participant themselves can remove a participant',
      );
    }

    // Find the participant
    const participant = await this.getParticipant(tripId, userId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    await repo.remove(participant);
  }

  async checkParticipation(
    tripId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.exists({ trip_id: tripId, user_id: userId }, manager);
  }

  async isUserPlannerOrCreator(
    tripId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    return this.exists(
      {
        trip_id: tripId,
        user_id: userId,
        role: In(['planner', 'creator']),
      },
      manager,
    );
  }
}
