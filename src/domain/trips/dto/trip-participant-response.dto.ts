import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TripParticipantResponseDto {
  @ApiProperty()
  @Expose()
  user_id: number;

  @ApiProperty()
  @Expose()
  username: string;

  @ApiProperty()
  @Expose()
  fullname: string;

  @ApiProperty()
  @Expose()
  role: string;

  @ApiProperty()
  @Expose()
  joined_at: string;
}
