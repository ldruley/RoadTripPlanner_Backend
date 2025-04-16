import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

//TODO: API PROPS
export class CreateStintDto {
  @IsString()
  name: string;

  @IsNumber()
  sequence_number: number;

  @IsString()
  trip_id: number;

  @IsString()
  @IsOptional()
  start_location_id?: number;

  @IsString()
  @IsOptional()
  end_location_id?: number;

  @IsNumber()
  @IsOptional()
  distance?: number;

  @IsNumber()
  @IsOptional()
  estimated_duration?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
