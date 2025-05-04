import { StintTimelineModel } from './trip-timeline-stint.interface';
export class TripTimelineModel {
  tripId: number;
  title: string;
  description: string;
  startDate: string | null;
  endDate: string | null;
  totalDistance: number;
  totalDuration: number;
  stints: StintTimelineModel[];
  participants?: TripParticipantInfo[];
  supplies?: TripSupplies[];
}
