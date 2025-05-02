import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GeocodeLocationDto {
  @ApiProperty({
    example: '123 Main St, San Francisco, CA 94105',
    description: 'Full or partial address to geocode',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  address: string;

  @ApiProperty({
    example: 'My Home',
    description: 'Optional name for the location',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 'Starting point for the trip',
    description: 'Optional description for the location',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
