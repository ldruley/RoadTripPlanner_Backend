import {IsString, IsOptional, IsDateString, IsBoolean, IsNotEmpty} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDto {
    @ApiProperty({
        example: 'West Coast Trip Updated',
        required: false,
        description: 'The updated title of the trip'
    })
    @IsOptional()
    @IsString()
    title?: string;

    @ApiProperty({
        example: 'Driving all the way up highway 1 and back again',
        description: 'An updated description of the trip',
        required: false
    })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiProperty({
        example: '2025-05-16',
        description: 'The updated planned start date of the trip in ISO format',
        required: false
    })
    @IsDateString()
    @IsOptional()
    start_date?: Date;

    @ApiProperty({
        example: '2025-06-02',
        description: 'The updated planned end date of the trip in ISO format',
        required: false
    })
    @IsDateString()
    @IsOptional()
    end_date?: Date;

    @ApiProperty({
        example: false,
        description: 'Whether the trip is publicly visible to other users',
        default: false,
        required: false
    })
    @IsBoolean()
    @IsOptional()
    is_public?: boolean;
}