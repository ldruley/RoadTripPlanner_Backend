// src/domain/itinerary/dto/update-stop.dto.ts
import { IsString, IsOptional, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { StopType } from '../../../common/enums';

export class UpdateStopDto {
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
    example: 240,
    description: 'Updated duration of stay in minutes',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiProperty({
    example: 'Bring hiking shoes, camera, and water',
    description: 'Updated additional notes about the stop',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
