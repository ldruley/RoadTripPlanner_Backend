import { TimelineItem } from './item.interface';
import { TimelineStop } from './stop.interface';

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
  continues_from_previous?: boolean;
  departure_stop?: TimelineStop;
  timeline: TimelineItem[];
}
