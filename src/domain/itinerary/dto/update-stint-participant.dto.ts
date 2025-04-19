import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ParticipantRole } from '../../../common/enums';

export class UpdateStintParticipantDto {
  @ApiProperty({
    enum: ParticipantRole,
    example: ParticipantRole.DRIVER,
    description: 'New role for the participant',
    required: true,
  })
  @IsEnum(ParticipantRole)
  role: ParticipantRole;
}
