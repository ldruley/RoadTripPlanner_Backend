import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class TimelineEventResponseDto {
  @ApiProperty({ enum: ['stop', 'leg', 'departure'] })
  @Expose()
  type: 'stop' | 'leg' | 'departure';

  @ApiProperty()
  @Expose()
  sequenceNumber: number;

  @ApiProperty()
  @Expose()
  data: any;
}
