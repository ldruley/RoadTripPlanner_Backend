import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { StintsService } from './stints.service';
import { StopsService } from './stops.service';
import { LegsService } from './legs.service';
import { Stint } from '../entities/stint.entity';
import { Stop } from '../entities/stop.entity';
import { Leg } from '../entities/leg.entity';
import { StopsRepository } from '../repositories/stops.repository';
import { StintsRepository } from '../repositories/stints.repository';
import { LegsRepository } from '../repositories/legs.repository';
import {
  TripTimeline,
  TimelineStint,
  TimelineStop,
  TimelineLeg,
} from '../../interfaces/itinerary';
import { TripsService } from '../../trips/trips.service';

@Injectable()
export class ItineraryService {
  constructor(
    @Inject(forwardRef(() => TripsService))
    private tripsService: TripsService,
    private stintsService: StintsService,
    private stopsService: StopsService,
    private legsService: LegsService,
    private stopsRepository: StopsRepository,
    private stintsRepository: StintsRepository,
    private legsRepository: LegsRepository,
    private dataSource: DataSource,
  ) {}

  /**
   * Get a complete trip timeline including all stints, stops, and legs
   */

  async getTripTimeline(tripId: number, userId: number): Promise<TripTimeline> {
    // First verify the trip exists and the user has access
    const trip = await this.tripsService.findOne(tripId);

    //Use userId to check if they have access to the trip

    // Get all stints for the trip
    const stints = await this.stintsRepository.findAllByTrip(tripId);
    if (!stints || stints.length === 0) {
      throw new NotFoundException(`No stints found for trip with ID ${tripId}`);
    }

    // Build the timeline
    const timeline: TripTimeline = {
      trip_id: tripId,
      title: trip.title,
      description: trip.description,
      start_date: trip.start_date,
      end_date: trip.end_date,
      total_distance: 0, // Will calculate below
      total_duration: 0, // Will calculate below
      stints: [],
    };

    // Process each stint
    for (const stint of stints) {
      const stintTimeline: TimelineStint = {
        stint_id: stint.stint_id,
        name: stint.name,
        sequence_number: stint.sequence_number,
        distance: stint.distance,
        estimated_duration: stint.estimated_duration,
        notes: stint.notes,
        stops: [],
        legs: [],
      };

      // Get stops for the stint
      const stops = await this.stopsRepository.findByStint(stint.stint_id);
      if (stops && stops.length > 0) {
        // Add stops to the stint timeline
        stintTimeline.stops = stops.map((stop) => ({
          stop_id: stop.stop_id,
          name: stop.name,
          latitude: stop.latitude,
          longitude: stop.longitude,
          address: stop.address,
          stop_type: stop.stop_type,
          arrival_time: stop.arrival_time,
          departure_time: stop.departure_time,
          duration: stop.duration,
          sequence_number: stop.sequence_number,
          notes: stop.notes,
        }));

        // Get legs for the stint
        const legs = await this.legsRepository.findByStint(stint.stint_id);
        if (legs && legs.length > 0) {
          // Add legs to the stint timeline
          stintTimeline.legs = legs.map((leg) => ({
            leg_id: leg.leg_id,
            distance: leg.distance,
            estimated_travel_time: leg.estimated_travel_time,
            route_type: leg.route_type,
            polyline: leg.polyline,
            notes: leg.notes,
          }));

          // Calculate total stint distance
          stintTimeline.distance = legs.reduce(
            (total, leg) => total + leg.distance,
            0,
          );

          // Calculate total stint duration
          stintTimeline.estimated_duration = legs.reduce(
            (total, leg) => total + leg.estimated_travel_time,
            0,
          );

          // Add stop durations to total stint duration
          if (stintTimeline.estimated_duration) {
            stops.forEach((stop) => {
              if (stop.duration) {
                stintTimeline.estimated_duration =
                  (stintTimeline.estimated_duration ?? 0) + stop.duration;
              }
            });
          }
        }
      }

      // Add stint to trip timeline
      timeline.stints.push(stintTimeline);

      // Add to total trip distance and duration
      if (stintTimeline.distance) {
        timeline.total_distance =
          (timeline.total_distance || 0) + stintTimeline.distance;
      }

      if (stintTimeline.estimated_duration) {
        timeline.total_duration =
          (timeline.total_duration || 0) + stintTimeline.estimated_duration;
      }
    }

    return timeline;
  }

  /**
   * Add a new stop to a stint and update legs automatically
   */
  async addStopToStint(
    stintId: number,
    stopData: any,
    userId: number,
  ): Promise<Stop> {
    const stint = await this.stintsService.findOne(stintId);
    if (!stint) {
      throw new NotFoundException(`Stint with ID ${stintId} not found`);
    }

    // Check if user has permission to modify this stint
    const trip = await this.tripsService.findOne(stint.trip_id);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this stint',
      );
    }

    // Start a transaction to ensure data consistency
    return this.dataSource.transaction(async (manager) => {
      // 1. Create the new stop
      const stopRepo = manager.getRepository(Stop);
      const newStop = stopRepo.create({
        ...stopData,
        stint_id: stintId,
        trip_id: stint.trip_id,
      });

      const savedResult = await stopRepo.save(newStop);
      const savedStop = Array.isArray(savedResult)
        ? savedResult[0]
        : savedResult;

      if (!savedStop) {
        throw new Error('Failed to save the new stop');
      }

      // 2. Get existing stops to determine where to insert legs
      const existingStops = await this.stopsRepository.findByStint(stintId);
      existingStops.sort((a, b) => a.sequence_number - b.sequence_number);

      // 3. Find the stops before and after the new stop based on sequence number
      const sequenceNumber = savedStop.sequence_number;
      const prevStop = existingStops.find(
        (s) => s.sequence_number === sequenceNumber - 1,
      );
      const nextStop = existingStops.find(
        (s) => s.sequence_number === sequenceNumber + 1,
      );

      const legRepo = manager.getRepository(Leg);

      // 4. If there's a previous stop, create a leg between prev and new stop
      if (prevStop) {
        // If a leg already existed between prevStop and nextStop, delete it
        if (nextStop) {
          const existingLeg = await this.legsRepository.findLegBetweenStops(
            prevStop.stop_id,
            nextStop.stop_id,
          );

          if (existingLeg) {
            await legRepo.remove(existingLeg);
          }
        }

        // Create new leg between prevStop and new stop
        // In a real implementation, you'd calculate distance and estimated_travel_time
        // using a routing API like Google Maps or HERE Maps
        const prevToNewLeg = legRepo.create({
          stint_id: stintId,
          start_stop_id: prevStop.stop_id,
          end_stop_id: savedStop.stop_id,
          sequence_number: prevStop.sequence_number,
          distance: 0, // Replace with API call
          estimated_travel_time: 0, // Replace with API call
        });

        await legRepo.save(prevToNewLeg);
      }

      // 5. If there's a next stop, create a leg between new stop and next
      if (nextStop) {
        // Create new leg between new stop and nextStop
        const newToNextLeg = legRepo.create({
          stint_id: stintId,
          start_stop_id: savedStop.stop_id,
          end_stop_id: nextStop.stop_id,
          sequence_number: savedStop.sequence_number,
          distance: 0, // Replace with API call
          estimated_travel_time: 0, // Replace with API call
        });

        await legRepo.save(newToNextLeg);
      }

      // 6. Update stint start/end location if needed
      if (
        sequenceNumber === 1 &&
        stint.start_location_id !== savedStop.stop_id
      ) {
        stint.start_location_id = savedStop.stop_id;
        await manager.getRepository(Stint).save(stint);
      }

      const isLastStop = !existingStops.some(
        (s) => s.sequence_number > sequenceNumber,
      );
      if (isLastStop && stint.end_location_id !== savedStop.stop_id) {
        stint.end_location_id = savedStop.stop_id;
        await manager.getRepository(Stint).save(stint);
      }

      return savedStop;
    });
  }

  /**
   * Calculate and update total distance for a stint
   */
  async updateStintDistance(stintId: number): Promise<number> {
    const legs = await this.legsRepository.findByStint(stintId);
    if (!legs || legs.length === 0) {
      return 0;
    }

    const totalDistance = legs.reduce((sum, leg) => sum + leg.distance, 0);

    // Update the stint with the new distance
    const stint = await this.stintsService.findOne(stintId);
    stint.distance = totalDistance;
    await this.stintsRepository.save(stint);

    return totalDistance;
  }

  /**
   * Calculate and update total duration for a stint
   */
  async updateStintDuration(stintId: number): Promise<number> {
    const legs = await this.legsRepository.findByStint(stintId);
    if (!legs || legs.length === 0) {
      return 0;
    }

    const totalDuration = legs.reduce(
      (sum, leg) => sum + leg.estimated_travel_time,
      0,
    );

    // Update the stint with the new duration
    const stint = await this.stintsService.findOne(stintId);
    stint.estimated_duration = totalDuration;
    await this.stintsRepository.save(stint);

    return totalDuration;
  }

  /**
   * Reorder stops within a stint and update legs accordingly
   */
  async reorderStops(
    stintId: number,
    stopOrder: number[],
    userId: number,
  ): Promise<void> {
    const stint = await this.stintsService.findOne(stintId);
    if (!stint) {
      throw new NotFoundException(`Stint with ID ${stintId} not found`);
    }

    // Check if user has permission to modify this stint
    const trip = await this.tripsService.findOne(stint.trip_id);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this stint',
      );
    }

    // Get existing stops
    const stops = await this.stopsRepository.findByStint(stintId);
    if (stops.length !== stopOrder.length) {
      throw new Error(
        'The provided stop order does not match the number of stops in the stint',
      );
    }

    // Start a transaction
    await this.dataSource.transaction(async (manager) => {
      // 1. Update sequence numbers
      const stopRepo = manager.getRepository(Stop);

      for (let i = 0; i < stopOrder.length; i++) {
        const stopId = stopOrder[i];
        const stop = stops.find((s) => s.stop_id === stopId);

        if (!stop) {
          throw new Error(
            `Stop with ID ${stopId} not found in stint ${stintId}`,
          );
        }

        // Update sequence number (adding 1 because sequence numbers typically start at 1)
        stop.sequence_number = i + 1;
        await stopRepo.save(stop);
      }

      // 2. Remove all existing legs
      const legRepo = manager.getRepository(Leg);
      const legs = await this.legsRepository.findByStint(stintId);
      await legRepo.remove(legs);

      // 3. Create new legs between adjacent stops in the new order
      const orderedStops = [...stops].sort(
        (a, b) => a.sequence_number - b.sequence_number,
      );

      for (let i = 0; i < orderedStops.length - 1; i++) {
        const currentStop = orderedStops[i];
        const nextStop = orderedStops[i + 1];

        // Create new leg (in a real implementation, you'd calculate distance and time)
        const newLeg = legRepo.create({
          stint_id: stintId,
          start_stop_id: currentStop.stop_id,
          end_stop_id: nextStop.stop_id,
          sequence_number: i + 1,
          distance: 0, // Replace with API call
          estimated_travel_time: 0, // Replace with API call
        });

        await legRepo.save(newLeg);
      }

      // 4. Update stint start and end locations if needed
      const firstStop = orderedStops[0];
      const lastStop = orderedStops[orderedStops.length - 1];

      if (
        stint.start_location_id !== firstStop.stop_id ||
        stint.end_location_id !== lastStop.stop_id
      ) {
        stint.start_location_id = firstStop.stop_id;
        stint.end_location_id = lastStop.stop_id;
        await manager.getRepository(Stint).save(stint);
      }
    });
  }
}
