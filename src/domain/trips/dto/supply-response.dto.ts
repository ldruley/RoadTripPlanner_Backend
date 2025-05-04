import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class SupplyResponseDto {
  @ApiProperty()
  @Expose()
  supply_id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  category: string;

  @ApiProperty()
  @Expose()
  quantity: number;

  @ApiProperty({ required: false })
  @Expose()
  notes?: string;
}
