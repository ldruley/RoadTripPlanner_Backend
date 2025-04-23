import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateStintDto {
    @ApiProperty({
        example: 'Revised California Coast Stint',
        description: 'Updated name of the stint',
        required: false
    })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({
        example: 2,
        description: 'Updated order of the stint within the trip',
        required: false,
        minimum: 1
    })
    @IsNumber()
    @IsOptional()
    @Min(1)
    sequence_number?: number;

    @ApiProperty({
        example: 42,
        description: 'Updated ID of the starting location stop',
        required: false
    })
    @IsNumber()
    @IsOptional()
    start_location_id?: number;

    @ApiProperty({
        example: 43,
        description: 'Updated ID of the ending location stop',
        required: false
    })
    @IsNumber()
    @IsOptional()
    end_location_id?: number;

    @ApiProperty({
        example: 375.2,
        description: 'Updated total distance of the stint in miles',
        required: false
    })
    @IsNumber()
    @IsOptional()
    distance?: number;

    @ApiProperty({
        example: 450,
        description: 'Updated estimated duration of the stint in minutes',
        required: false
    })
    @IsNumber()
    @IsOptional()
    estimated_duration?: number;

    @ApiProperty({
        example: 'Taking an alternative route with additional scenic stops',
        description: 'Updated notes about the stint',
        required: false
    })
    @IsString()
    @IsOptional()
    notes?: string;
}