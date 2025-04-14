import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

//TODO: API PROPS
export class CreateStintDto {
    @IsString()
    name: string;

    @IsNumber()
    sequence_number: number;

    @IsString()
    trip_id: string;

    @IsString()
    start_location_id: string;

    @IsString()
    end_location_id: string;

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