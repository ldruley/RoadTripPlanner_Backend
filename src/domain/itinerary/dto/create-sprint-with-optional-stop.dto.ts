import { ApiProperty } from '@nestjs/swagger';
import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { StopType } from '../../../common/enums';

class InitialStopDto {
  @ApiProperty({
    example: 'San Francisco',
    description: 'Name of the initial stop',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 37.7749,
    description: 'Latitude coordinate',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({
    example: -122.4194,
    description: 'Longitude coordinate',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiProperty({
    example: '123 Main St, San Francisco, CA',
    description: 'Physical address of the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    enum: StopType,
    description: 'Type of stop',
    example: StopType.PITSTOP,
    default: StopType.PITSTOP,
  })
  @IsOptional()
  stopType?: StopType = StopType.PITSTOP;

  @ApiProperty({
    example: 'Our journey begins here',
    description: 'Additional notes about the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 30,
    description:
      'Estimated duration at the stop in minutes - optional if this is just departure location/start of trip',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;
}

export class CreateStintWithOptionalStopDto {
  @ApiProperty({
    example: 'California Coast Drive',
    description: 'Name of the stint',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 1,
    description: 'Order of the stint within the trip',
    required: true,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  sequence_number: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the trip this stint belongs to',
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  trip_id: number;

  @ApiProperty({
    description: 'Initial stop details - required only for the first stint',
    required: false,
    type: InitialStopDto,
  })
  @ValidateIf((o: CreateStintWithOptionalStopDto) => o.sequence_number === 1)
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => InitialStopDto)
  initialStop?: InitialStopDto;

  @ApiProperty({
    example: 'Scenic coastal route with stops at major viewpoints',
    description: 'Additional notes about the stint',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: '2025-05-15T08:00:00Z',
    description:
      'Start time for the stint - used if we are creating the first stint',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  start_time?: Date;
}
