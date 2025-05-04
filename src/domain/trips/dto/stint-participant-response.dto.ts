import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class StintVehicleResponseDto {
  @ApiProperty()
  @Expose()
  vehicle_id: number;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  year: number;

  @ApiProperty({ required: false })
  @Expose()
  driver?: {
    user_id: number;
    username: string;
    fullname: string;
  };
}
