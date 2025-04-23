import {IsNotEmpty, IsNumber, IsOptional, IsString, Min, MinLength} from "class-validator";
import {ApiProperty} from "@nestjs/swagger";


export class CreateVehicleDto {

    @ApiProperty({
        example: 'Toyota Hilux',
        description: 'Vehicle name',
        minLength: 3
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    name: string;


    @ApiProperty({
        example: 2020,
        description: 'Vehicle year',
        required: false,
    })
    @IsOptional()
    @IsNumber()
    @Min(1900)
    year: number;


    @ApiProperty({
        example: 50,
        description: 'Fuel capacity in gallons',
        required: true
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    fuel_capacity: number;

    @ApiProperty({
        example: 25,
        description: 'Miles per gallon (mpg)',
        required: true
    })
    @IsNotEmpty()
    @IsNumber()
    @Min(0)
    mpg: number;

    @ApiProperty({
        example: 1,
        description: 'Owner ID',
        required: true
    })
    @IsNotEmpty()
    @IsNumber()
    owner_id: number;
}