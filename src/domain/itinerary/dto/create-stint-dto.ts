import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsNotEmpty,
  IsBoolean,
  IsDate,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateStintDto {
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
    example: 42,
    description: 'ID of the starting location stop',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  start_location_id?: number;

  @ApiProperty({
    example: 43,
    description: 'ID of the ending location stop',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  end_location_id?: number;

  @ApiProperty({
    example: 350.5,
    description: 'Total distance of the stint in miles',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  distance?: number;

  @ApiProperty({
    example: 420,
    description: 'Estimated duration of the stint in minutes',
    required: false,
  })
  @IsNumber()
  @IsOptional()
  estimated_duration?: number;

  @ApiProperty({
    example: 'Scenic coastal route with stops at major viewpoints',
    description: 'Additional notes about the stint',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({
    example: true,
    description: 'Indicates if this stint continues from the previous one',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  continues_from_previous?: boolean;

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
