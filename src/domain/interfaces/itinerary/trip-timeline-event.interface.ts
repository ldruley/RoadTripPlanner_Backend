export type TimelineEventType = 'stop' | 'leg' | 'departure';

export interface TimelineEventModel {
  type: TimelineEventType;
  sequenceNumber: number;
  data: StopEventData | LegEventData | DepartureEventData;
}

export interface StopEventData {
  stop_id: number;
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  stop_type: string;
  arrival_time: string;
  departure_time: string;
  duration: number;
  sequence_number: number;
  notes?: string;
}

export interface LegEventData {
  leg_id: number;
  distance: number;
  estimated_travel_time: number;
  route_type: string;
  polyline?: string;
  notes?: string;
  start_stop_name: string;
  end_stop_name: string;
}

export interface DepartureEventData {
  stop_id: number; // Always 0 or a special ID
  name: string;
  latitude: number;
  longitude: number;
  address: string;
  stop_type: string; // Probably always StopType.DEPARTURE
  arrival_time: string | null;
  departure_time: string | null;
  duration: number;
  sequence_number: number;
  notes?: string;
}
