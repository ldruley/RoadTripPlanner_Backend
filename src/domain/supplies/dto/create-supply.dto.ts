import { SupplyCategory } from '../../../common/enums';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class CreateSupplyDto {
  @ApiProperty({
    example: '4 person tent',
    required: true,
    description: 'The name of the item',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    enum: SupplyCategory,
    description: 'Supply Category',
    example: SupplyCategory.GEAR,
    required: true,
  })
  @IsNotEmpty()
  @IsEnum(SupplyCategory)
  category: SupplyCategory;
}
