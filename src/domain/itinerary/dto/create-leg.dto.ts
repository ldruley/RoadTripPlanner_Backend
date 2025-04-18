import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { RouteType } from '../entities/leg.entity';

export class CreateLegDto {
  @ApiProperty({
    example: 1,
    description: 'The stint this leg belongs to',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  stint_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the starting stop',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  start_stop_id: number;

  @ApiProperty({
    example: 2,
    description: 'ID of the ending stop',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  end_stop_id: number;

  @ApiProperty({
    example: 1,
    description: 'Sequence number within the stint',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  sequence_number: number;

  @ApiProperty({
    example: 25.5,
    description: 'Distance between stops in miles',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  distance: number;

  @ApiProperty({
    example: 45,
    description: 'Estimated travel time in minutes',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  estimated_travel_time: number;

  @ApiProperty({
    enum: RouteType,
    description: 'Type of route',
    example: RouteType.HIGHWAY,
    required: false,
  })
  @IsOptional()
  @IsEnum(RouteType)
  route_type?: RouteType;

  @ApiProperty({
    example: 'Scenic drive along the coast',
    description: 'Additional notes about the leg',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'kjahdkjhas8767asdjhasd98',
    description: 'Encoded polyline for map display',
    required: false,
  })
  @IsOptional()
  @IsString()
  polyline?: string;
}
