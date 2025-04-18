import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { RouteType } from '../entities/leg.entity';

export class UpdateLegDto {
  @ApiProperty({
    example: 3,
    description: 'Updated sequence number within the stint',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  sequence_number?: number;

  @ApiProperty({
    example: 30.2,
    description: 'Updated distance between stops in miles',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  distance?: number;

  @ApiProperty({
    example: 60,
    description: 'Updated estimated travel time in minutes',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  estimated_travel_time?: number;

  @ApiProperty({
    enum: RouteType,
    description: 'Updated type of route',
    example: RouteType.BACKROAD,
    required: false,
  })
  @IsOptional()
  @IsEnum(RouteType)
  route_type?: RouteType;

  @ApiProperty({
    example: 'Taking the scenic route instead of highway',
    description: 'Updated notes about the leg',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 'kjahdkjhas8767asdjhasd98',
    description: 'Updated encoded polyline for map display',
    required: false,
  })
  @IsOptional()
  @IsString()
  polyline?: string;
}
