import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { TimelineEventResponseDto } from './event-timeline-response.dto';

export class StintTimelineResponseDto {
  @ApiProperty()
  @Expose()
  stintId: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  sequenceNumber: number;

  @ApiProperty()
  @Expose()
  distance: number;

  @ApiProperty()
  @Expose()
  estimatedDuration: number;

  @ApiProperty()
  @Expose()
  notes?: string;

  @ApiProperty()
  @Expose()
  continuesFromPrevious: boolean;

  @ApiProperty()
  @Expose()
  startTime: string;

  @ApiProperty()
  @Expose()
  endTime: string;

  @ApiProperty()
  @Expose()
  startLocationName?: string;

  @ApiProperty()
  @Expose()
  endLocationName?: string;

  @ApiProperty({ type: [TimelineEventResponseDto] })
  @Expose()
  @Type(() => TimelineEventResponseDto)
  timeline: TimelineEventResponseDto[];

  @ApiProperty({ required: false })
  @Expose()
  googleMapsUrl?: string;
}
