//TODO: We need to ensure that a creator can not be removed from a trip + cannot have role changed
// and is set by default as creator

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { StintParticipant } from '../entities/stint-participant.entity';
import { ParticipantRole } from '../../../common/enums';
import { StintsService } from './stints.service';
import { UsersService } from '../../users/users.service';
import { CreateStintParticipantDto } from '../dto/create-stint-participant.dto';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as Console from 'node:console';

@Injectable()
export class StintParticipantService {
  constructor(
    @InjectRepository(StintParticipant)
    private stintParticipantRepository: Repository<StintParticipant>,
    private stintsService: StintsService,
    private usersService: UsersService,
  ) {}

  async getParticipant(
    stintId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<StintParticipant> {
    const repo = manager
      ? manager.getRepository(StintParticipant)
      : this.stintParticipantRepository;
    const participant = await repo.findOne({
      where: {
        stint_id: stintId,
        user_id: userId,
      },
    });
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }
    return participant;
  }

  async addParticipant(
    createStintParticipantDto: CreateStintParticipantDto,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<StintParticipant> {
    const repo = manager
      ? manager.getRepository(StintParticipant)
      : this.stintParticipantRepository;

    // Check if the stint exists
    const stint = await this.stintsService.findById(
      createStintParticipantDto.stint_id,
    );

    // Check if requester has permission (is creator of the trip)
    if (stint.trip.creator_id !== requesterId) {
      throw new ForbiddenException(
        'Only the trip creator can add participants',
      );
    }

    // Check if the user exists
    const user = await this.usersService.findOne(
      createStintParticipantDto.user_id,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if the user is already a participant
    const existingParticipant = await this.checkParticipation(
      createStintParticipantDto.stint_id,
      createStintParticipantDto.user_id,
      manager,
    );
    if (existingParticipant) {
      throw new ConflictException(
        'User is already a participant in this stint',
      );
    }

    // Create a new participant
    const participant = repo.create(createStintParticipantDto);

    return this.stintParticipantRepository.save(participant);
  }

  async findByStint(
    stintId: number,
    manager?: EntityManager,
  ): Promise<StintParticipant[]> {
    const repo = manager
      ? manager.getRepository(StintParticipant)
      : this.stintParticipantRepository;
    const participants = await repo.find({
      where: {
        stint_id: stintId,
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
  ): Promise<StintParticipant[]> {
    const repo = manager
      ? manager.getRepository(StintParticipant)
      : this.stintParticipantRepository;
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
    stintId: number,
    userId: number,
    newRole: ParticipantRole,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<StintParticipant> {
    // Check if the stint exists
    const stint = await this.stintsService.findById(stintId, manager);

    // Check if requester has permission
    if (stint.trip.creator_id !== requesterId) {
      throw new ForbiddenException(
        'Only the trip creator can update participant roles',
      );
    }

    // Find the participant
    const participant = await this.getParticipant(stintId, userId, manager);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    // Update role
    participant.role = newRole;
    return this.stintParticipantRepository.save(participant);
  }

  async removeParticipant(
    stintId: number,
    userId: number,
    requesterId: number,
    manager?: EntityManager,
  ): Promise<void> {
    // Check if the stint exists
    const stint = await this.stintsService.findById(stintId, manager);

    // Check if requester has permission or is removing themselves
    if (stint.trip.creator_id !== requesterId && userId !== requesterId) {
      throw new ForbiddenException(
        'Only the trip creator or the participant themselves can remove a participant',
      );
    }

    // Find the participant
    const participant = await this.getParticipant(stintId, userId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    await this.stintParticipantRepository.remove(participant);
  }

  async checkParticipation(
    stintId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const repo = manager
      ? manager.getRepository(StintParticipant)
      : this.stintParticipantRepository;
    const participant = await repo.findOne({
      where: {
        stint_id: stintId,
        user_id: userId,
      },
    });
    return !!participant;
  }
}
