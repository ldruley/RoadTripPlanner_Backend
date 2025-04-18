import { TimelineStint } from './stint.interface';

/**
 * Interface representing a complete trip timeline
 * with all stints, stops, and legs
 */
export interface TripTimeline {
  trip_id: number;
  title: string;
  description?: string;
  start_date?: Date;
  end_date?: Date;
  total_distance?: number;
  total_duration?: number;
  stints: TimelineStint[];
}
