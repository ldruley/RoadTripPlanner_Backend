import {
  IsString,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTripDto {
  @ApiProperty({
    example: 'West Coast Trip',
    description: 'The title of the trip',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Driving all the way up highway 1',
    description: 'A detailed description of the trip',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: '2025-05-15',
    description: 'The planned start date of the trip in ISO format',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  start_date?: Date;

  @ApiProperty({
    example: '2025-05-30',
    description: 'The planned end date of the trip in ISO format',
    required: false,
  })
  @IsDateString()
  @IsOptional()
  end_date?: Date;

  @ApiProperty({
    example: false,
    description: 'Whether the trip is publicly visible to other users',
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  is_public?: boolean;
}
