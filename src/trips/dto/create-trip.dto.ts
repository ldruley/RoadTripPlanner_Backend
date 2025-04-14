import {IsString, IsOptional, IsDateString, IsBoolean, IsNotEmpty} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTripDto {
    @ApiProperty({ example: 'West Coast Trip' })
    @IsNotEmpty()
    @IsString()
    title: string;

    @ApiProperty({ example: 'Driving all the way up highway 1' })
    @IsString()
    @IsOptional()
    description?: string;

    //TODO: API PROPS
    @IsDateString()
    @IsOptional()
    start_date?: Date;

    @IsDateString()
    @IsOptional()
    end_date?: Date;

    @IsBoolean()
    @IsOptional()
    is_public?: boolean;
}