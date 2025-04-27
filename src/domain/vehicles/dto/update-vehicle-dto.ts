import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateVehicleDto {
  @ApiProperty({
    example: 'Toyota Hilux v2',
    description: 'Updated vehicle name',
    minLength: 3,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    example: 2022,
    description: 'Updated Vehicle year',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1900)
  year: number;

  @ApiProperty({
    example: 15,
    description: 'Updated Fuel capacity in gallons',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fuel_capacity: number;

  @ApiProperty({
    example: 20,
    description: 'Updated miles per gallon (mpg)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  mpg: number;
}
