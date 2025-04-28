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
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as Console from 'node:console';
import { TripParticipant } from '../entities/trip-participant.entity';
import { TripsService } from './trips.service';

@Injectable()
export class TripParticipantService {
  constructor(
    @InjectRepository(TripParticipant)
    private tripParticipantRepository: Repository<TripParticipant>,
    private readonly tripsService: TripsService,
    private readonly usersService: UsersService,
  ) {}

  async getParticipant(
    tripId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<TripParticipant> {
    const repo = manager
      ? manager.getRepository(TripParticipant)
      : this.tripParticipantRepository;
    const participant = await repo.findOne({
      where: {
        trip_id: tripId,
        user_id: userId,
      },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    return participant;
  }

  async addParticipant(
    createTripParticipantDto: CreateTripParticipantDto,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<TripParticipant> {
    const repo = manager
      ? manager.getRepository(TripParticipant)
      : this.tripParticipantRepository;

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
    const repo = manager
      ? manager.getRepository(TripParticipant)
      : this.tripParticipantRepository;
    const participants = await repo.find({
      where: {
        trip_id: stintId,
      },
    });
    if (!participants) {
      Console.warn('Participants not found');
    }
    return participants;
  }

  async findByUser(
    userId: number,
    manager?: EntityManager,
  ): Promise<TripParticipant[]> {
    const repo = manager
      ? manager.getRepository(TripParticipant)
      : this.tripParticipantRepository;
    const participants = await repo.find({
      where: {
        user_id: userId,
      },
    });
    if (!participants) {
      Console.warn('Participants not found');
    }
    return participants;
  }

  //TODO: Use a DTO for this if we can
  async updateRole(
    tripId: number,
    userId: number,
    newRole: ParticipantRole,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<TripParticipant> {
    const repo = manager
      ? manager.getRepository(TripParticipant)
      : this.tripParticipantRepository;
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
    const repo = manager
      ? manager.getRepository(TripParticipant)
      : this.tripParticipantRepository;

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
    const repo = manager
      ? manager.getRepository(TripParticipant)
      : this.tripParticipantRepository;
    const participant = await repo.findOne({
      where: {
        trip_id: tripId,
        user_id: userId,
      },
    });
    return !!participant;
  }
}
