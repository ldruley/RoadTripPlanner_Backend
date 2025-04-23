import { TimelineStop } from './stop.interface';
import { TimelineLeg } from './leg.interface';

/**
 * Interface representing an item in the timeline
 * This can be either a stop or a leg
 * */

export interface TimelineItem {
  type: 'stop' | 'leg' | 'departure';
  sequence_number: number;
  item: TimelineStop | TimelineLeg;
}
