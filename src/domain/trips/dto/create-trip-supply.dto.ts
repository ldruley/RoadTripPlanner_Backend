import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  IsEnum,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SupplyCategory } from '../../../common/enums';
import { CreateSupplyDto } from '../../supplies/dto/create-supply.dto';

export class CreateTripSupplyDto {
  @ApiProperty({
    example: 1,
    description: 'ID of the trip',
    required: true,
  })
  @IsNotEmpty()
  @IsNumber()
  trip_id: number;

  @ApiProperty({
    example: 2,
    description: 'ID of an existing supply (optional if creating new supply)',
    required: false,
  })
  @IsOptional()
  @IsNumber()
  supply_id?: number;

  @ApiProperty({
    example: 3,
    description: 'Quantity of the supply',
    required: true,
    default: 1,
  })
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity: number = 1;

  @ApiProperty({
    example: 'Store in cool place',
    description: 'Notes about the supply',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({
    description: 'New supply details (when creating a new supply)',
    required: false,
    type: CreateSupplyDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSupplyDto)
  new_supply?: CreateSupplyDto;
}
