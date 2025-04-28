import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ParticipantRole } from '../../../common/enums';

export class CreateTripParticipantDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the stint',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  trip_id: number;

  @ApiProperty({
    example: 2,
    description: 'ID of the user to add as participant',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  user_id: number;

  @ApiProperty({
    enum: ParticipantRole,
    example: ParticipantRole.MEMBER,
    description: 'Role of the participant in the stint',
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(ParticipantRole)
  role: ParticipantRole;
}
