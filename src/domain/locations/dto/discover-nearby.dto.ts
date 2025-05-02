import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  Min,
  IsNotEmpty,
  ValidateIf,
} from 'class-validator';

export class DiscoverNearbyDto {
  @ApiProperty({
    example: 'restaurant',
    description: 'Search query for nearby locations',
    required: true,
  })
  @IsNotEmpty()
  @IsString()
  query: string;

  @ApiProperty({
    example: 1,
    description:
      'ID of the stop to use as search center (either stopId or locationId must be provided)',
    required: false,
  })
  @ValidateIf((o) => !o.locationId)
  @IsNumber()
  stopId?: number;

  @ApiProperty({
    example: 1,
    description:
      'ID of the location to use as search center (either stopId or locationId must be provided)',
    required: false,
  })
  @ValidateIf((o) => !o.stopId)
  @IsNumber()
  locationId?: number;

  @ApiProperty({
    example: 10,
    description: 'Maximum number of results to return',
    required: false,
    default: 10,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiProperty({
    example: 5000,
    description: 'Search radius in meters',
    required: false,
    default: 5000,
  })
  @IsOptional()
  @IsNumber()
  @Min(100)
  radius?: number = 5000;
}
