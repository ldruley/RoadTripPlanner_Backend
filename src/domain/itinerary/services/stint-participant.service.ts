//TODO: We need to ensure that a creator can not be removed from a trip + cannot have role changed
// and is set by default as creator

import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { StintParticipantRepository } from '../repositories/stint-participant.repository';
import { StintParticipant } from '../entities/stint-participant.entity';
import { ParticipantRole } from '../../../common/enums';
import { StintsService } from './stints.service';
import { UsersService } from '../../users/users.service';
import { CreateStintParticipantDto } from '../dto/create-stint-participant.dto';

@Injectable()
export class StintParticipantService {
  constructor(
    private stintParticipantRepository: StintParticipantRepository,
    private stintsService: StintsService,
    private usersService: UsersService,
  ) {}

  async addParticipant(
    createStintParticipantDto: CreateStintParticipantDto,
    requesterId: number,
  ): Promise<StintParticipant> {
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
    const existingParticipant =
      await this.stintParticipantRepository.findByStintAndUser(
        createStintParticipantDto.stint_id,
        createStintParticipantDto.user_id,
      );
    if (existingParticipant) {
      throw new ConflictException(
        'User is already a participant in this stint',
      );
    }

    // Create a new participant
    const participant = this.stintParticipantRepository.create(
      createStintParticipantDto,
    );

    return this.stintParticipantRepository.save(participant);
  }

  async findByStint(stintId: number): Promise<StintParticipant[]> {
    return this.stintParticipantRepository.findByStint(stintId);
  }

  async findByUser(userId: number): Promise<StintParticipant[]> {
    return this.stintParticipantRepository.findByUser(userId);
  }

  //TODO: Use a DTO for this if we can
  async updateRole(
    stintId: number,
    userId: number,
    newRole: ParticipantRole,
    requesterId: number,
  ): Promise<StintParticipant> {
    // Check if the stint exists
    const stint = await this.stintsService.findById(stintId);

    // Check if requester has permission
    if (stint.trip.creator_id !== requesterId) {
      throw new ForbiddenException(
        'Only the trip creator can update participant roles',
      );
    }

    // Find the participant
    const participant =
      await this.stintParticipantRepository.findByStintAndUser(stintId, userId);
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
  ): Promise<void> {
    // Check if the stint exists
    const stint = await this.stintsService.findById(stintId);

    // Check if requester has permission or is removing themselves
    if (stint.trip.creator_id !== requesterId && userId !== requesterId) {
      throw new ForbiddenException(
        'Only the trip creator or the participant themselves can remove a participant',
      );
    }

    // Find the participant
    const participant =
      await this.stintParticipantRepository.findByStintAndUser(stintId, userId);
    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    await this.stintParticipantRepository.remove(participant);
  }
}
