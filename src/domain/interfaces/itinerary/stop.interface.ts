import { StopType } from '../../../common/enums';

/**
 * Interface representing a stop in the timeline
 */
export interface TimelineStop {
  stop_id: number;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  stop_type: StopType;
  arrival_time?: Date;
  departure_time?: Date;
  duration?: number;
  sequence_number: number;
  notes?: string;
}
