import {
  IsString,
  IsNumber,
  IsOptional,
  IsEnum,
  IsDate,
  Min,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StopType } from '../../../common/enums';
import { Type } from 'class-transformer';

export class UpdateStopDto {
  @ApiProperty({
    example: 'Updated Golden Gate Park',
    description: 'Updated name of the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({
    example: 37.7749,
    description: 'Updated latitude coordinate',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiProperty({
    example: -122.4194,
    description: 'Updated longitude coordinate',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  longitude?: number;

  @ApiProperty({
    example: '501 Stanyan St, San Francisco, CA 94117',
    description: 'Updated physical address of the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({
    enum: StopType,
    description: 'Updated type of stop',
    example: StopType.OVERNIGHT,
    required: false,
  })
  @IsOptional()
  @IsEnum(StopType)
  stop_type?: StopType;

  @ApiProperty({
    example: '2025-05-15T15:00:00Z',
    description: 'Updated planned arrival time',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  arrival_time?: Date;

  @ApiProperty({
    example: '2025-05-15T18:00:00Z',
    description: 'Updated planned departure time',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  departure_time?: Date;

  @ApiProperty({
    example: 240,
    description: 'Updated duration of stay in minutes',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({
    example: 2,
    description: 'Updated sequence number in the stint',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  sequence_number?: number;

  @ApiProperty({
    example: 'Bring hiking shoes, camera, and water',
    description: 'Updated additional notes about the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    example: 2,
    description: 'Updated ID of the stint this stop belongs to',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  stint_id?: number;
}
