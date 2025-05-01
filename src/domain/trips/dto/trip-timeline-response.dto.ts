import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { StintTimelineResponseDto } from './stint-timeline-response.dto';

export class TripTimelineResponseDto {
  @ApiProperty()
  @Expose()
  tripId: number;

  @ApiProperty()
  @Expose()
  title: string;

  @ApiProperty()
  @Expose()
  description: string;

  @ApiProperty()
  @Expose()
  startDate: string; // ISO string (e.g., '2025-05-01T00:00:00Z')

  @ApiProperty()
  @Expose()
  endDate: string;

  @ApiProperty()
  @Expose()
  totalDistance: number;

  @ApiProperty()
  @Expose()
  totalDuration: number;

  @ApiProperty({ type: [StintTimelineResponseDto] })
  @Expose()
  @Type(() => StintTimelineResponseDto)
  stints: StintTimelineResponseDto[];
}
