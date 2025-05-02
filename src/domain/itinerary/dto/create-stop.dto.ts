import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDate,
  IsNotEmpty,
  Min,
  ValidateIf,
} from 'class-validator';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { StopType } from '../../../common/enums';
import { Type } from 'class-transformer';

export class CreateStopDto {
  @ApiProperty({
    example: 'Golden Gate Park',
    description: 'Name of the stop',
    required: false,
  })
  @IsOptional()
  @ValidateIf((o) => !o.location_id)
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    example: 37.7749,
    description: 'Latitude coordinate',
    required: false,
  })
  @IsOptional() // Make optional when location_id is provided
  @ValidateIf((o) => !o.location_id)
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @ApiProperty({
    example: -122.4194,
    description: 'Longitude coordinate',
    required: false,
  })
  @IsOptional() // Make optional when location_id is provided
  @ValidateIf((o) => !o.location_id)
  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @ApiProperty({
    example: '501 Stanyan St, San Francisco, CA 94117',
    description: 'Physical address of the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    enum: StopType,
    description: 'Type of stop',
    example: StopType.ATTRACTION,
    default: StopType.PITSTOP,
  })
  @IsEnum(StopType)
  stop_type: StopType;

  /*@ApiProperty({
    example: '2025-05-15T14:00:00Z',
    description: 'Planned arrival time',
    required: false,
  })*/
  @ApiHideProperty()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  arrival_time?: Date;

  /*  @ApiProperty({
    example: '2025-05-15T17:00:00Z',
    description: 'Planned departure time',
    required: false,
  })*/
  @ApiHideProperty()
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  departure_time?: Date;

  @ApiProperty({
    example: 180,
    description: 'Duration of stay in minutes',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({
    example: 1,
    description:
      'Sequence number in the stint. If omitted or set to 0, the stop will be added to the end of the sequence.',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sequence_number?: number;

  @ApiProperty({
    example: 'Bring hiking shoes and camera',
    description: 'Additional notes about the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 1,
    description: 'ID of the trip this stop belongs to',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  trip_id: number;

  @ApiProperty({
    example: 1,
    description: 'ID of the stint this stop belongs to',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  stint_id: number;

  @ApiProperty({
    example: 'San Francisco',
    description: 'City of the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiProperty({
    example: 'CA',
    description: 'State of the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({
    example: '94117',
    description: 'Postal code of the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  postal_code?: string;

  @ApiProperty({
    example: 'USA',
    description: 'Country of the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiProperty({
    example: '42',
    description:
      'ID of the location this stop belongs to. When let users search for a location, we can use this in place of having to send details like lat/long, address, etc',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  location_id?: number;
}
