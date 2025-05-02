import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateTripSupplyDto {
  @ApiProperty({
    example: 3,
    description: 'Updated quantity of the supply',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    example: 'Keep in a dry place',
    description: 'Updated notes about the supply',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
