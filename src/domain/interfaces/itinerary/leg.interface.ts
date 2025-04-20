import { RouteType } from '../../itinerary/entities/leg.entity';

/**
 * Interface representing a leg (journey between stops) in the timeline
 */
export interface TimelineLeg {
  leg_id: number;
  distance: number;
  estimated_travel_time: number;
  route_type?: RouteType;
  polyline?: string;
  notes?: string;
  start_stop_name?: string;
  end_stop_name?: string;
}
