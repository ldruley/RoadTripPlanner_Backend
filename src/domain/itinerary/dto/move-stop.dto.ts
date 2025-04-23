import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty, IsOptional, Min } from 'class-validator';

/**
 * DTO for moving a stop to a different stint
 */
export class MoveStopDto {
  @ApiProperty({
    example: 2,
    description: 'ID of the stint to move the stop to',
  })
  @IsNotEmpty()
  @IsNumber()
  newStintId: number;

  @ApiProperty({
    example: 3,
    description:
      'Desired sequence number in the new stint. If omitted or set to 0, the stop will be added to the end of the sequence.',
    required: false,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  sequenceNumber?: number;
}
