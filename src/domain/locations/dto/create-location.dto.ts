// src/domain/locations/dto/create-location.dto.ts
import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { LocationCategoryCode } from '../../../common/enums';

export class CreateLocationDto {
  @ApiProperty({
    example: 'Golden Gate Park',
    description: 'Name of the location',
  })
  @IsString()
  name: string;

  @ApiProperty({
    example: 'A large urban park with gardens, museums, and recreational areas',
    description: 'Description of the location',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    example: '501 Stanyan St',
    description: 'Street address of the location',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    example: 'San Francisco',
    description: 'City of the location',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    example: 'CA',
    description: 'State of the location',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    example: '94117',
    description: 'Postal code of the location',
    required: false,
  })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country of the location',
    required: false,
    default: 'USA',
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: 37.7749,
    description: 'Latitude coordinate of the location',
  })
  @IsNumber()
  latitude: number;

  @ApiProperty({
    example: -122.4194,
    description: 'Longitude coordinate of the location',
  })
  @IsNumber()
  longitude: number;

  @ApiProperty({
    enum: LocationCategoryCode,
    example: LocationCategoryCode.GAS_STATION,
    description: 'Type of location',
    required: false,
    default: LocationCategoryCode.OTHER,
  })
  @IsOptional()
  @IsEnum(LocationCategoryCode)
  location_type?: LocationCategoryCode = LocationCategoryCode.GAS_STATION;

  @ApiProperty({
    example: 'here-123456',
    description: 'External ID from a third-party API',
    required: false,
  })
  @IsOptional()
  @IsString()
  external_id?: string;

  @ApiProperty({
    example: 'here',
    description: 'Source of the external data',
    required: false,
  })
  @IsOptional()
  @IsString()
  external_source?: string;
}
