import { PartialType } from '@nestjs/swagger';
import { CreateLocationDto } from './create-location.dto';
import { IsBoolean, IsNumber, IsOptional, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Point } from 'geojson';

export class UpdateLocationDto extends PartialType(CreateLocationDto) {
  @ApiProperty({
    example: true,
    description: 'Whether the location is verified',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  is_verified?: boolean;

  // This is for internal use, not exposed in API
  geom?: Point;
}
