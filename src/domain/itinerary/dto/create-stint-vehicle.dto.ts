import { IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateStintVehicleDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the stint',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  stint_id: number;

  @ApiProperty({
    example: 2,
    description: 'ID of the vehicle',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  vehicle_id: number;

  @ApiProperty({
    example: 3,
    description: 'ID of the user assigned as driver (optional)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  driver_id?: number;
}
