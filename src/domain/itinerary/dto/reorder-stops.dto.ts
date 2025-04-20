import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsNotEmpty,
  ValidateNested,
  ArrayMinSize,
  Min,
} from 'class-validator';

/**
 * DTO for a stop's new sequence information
 */
class StopSequenceItem {
  @ApiProperty({
    example: 1,
    description: 'The ID of the stop',
  })
  @IsNotEmpty()
  @IsNumber()
  stop_id: number;

  @ApiProperty({
    example: 2,
    description: 'The new sequence number for the stop',
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  sequence_number: number;
}

/**
 * DTO for reordering stops within a stint
 */
export class ReorderStopsDto {
  @ApiProperty({
    type: [StopSequenceItem],
    description: 'Array of stops with their new sequence numbers',
    example: [
      { stop_id: 1, sequence_number: 3 },
      { stop_id: 2, sequence_number: 1 },
      { stop_id: 3, sequence_number: 2 },
    ],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => StopSequenceItem)
  stopOrder: StopSequenceItem[];
}
