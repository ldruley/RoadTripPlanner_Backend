import { TimelineEventModel } from './trip-timeline-event.interface';

export class StintTimelineModel {
  stintId: number;
  name: string;
  sequenceNumber: number;
  distance: number;
  estimatedDuration: number;
  notes?: string;
  continuesFromPrevious: boolean;
  startTime: string | null;
  endTime: string | null;
  startLocationName?: string;
  endLocationName?: string;
  timeline: TimelineEventModel[];
  vehicles?: StintVehicleInfo[];
  googleMapsUrl?: string;
}
