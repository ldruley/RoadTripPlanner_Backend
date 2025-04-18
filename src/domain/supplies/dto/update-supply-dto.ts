import { SupplyCategory } from '../../../common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateSupplyDto {
  @ApiProperty({
    example: '6 person tent',
    required: false,
    description: 'The updated name of the item',
  })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    enum: SupplyCategory,
    description: 'Updated Supply Category',
    example: SupplyCategory.FOOD,
  })
  @IsOptional()
  @IsEnum(SupplyCategory)
  category: SupplyCategory;
}
