import { TimelineStop } from './stop.interface';
import { TimelineLeg } from './leg.interface';

/**
 * Interface representing a stint in the trip timeline
 */
export interface TimelineStint {
  stint_id: number;
  name: string;
  sequence_number: number;
  distance?: number;
  estimated_duration?: number;
  notes?: string;
  start_date?: Date;
  end_date?: Date;
  start_location_name?: string;
  end_location_name?: string;
  stops: TimelineStop[];
  legs: TimelineLeg[];
}
