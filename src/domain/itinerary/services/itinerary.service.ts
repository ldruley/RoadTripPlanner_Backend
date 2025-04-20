import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { DataSource, EntityManager, MoreThan } from 'typeorm';
import { MoreThanOrEqual } from 'typeorm';
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
  //TimelineStop,
  //TimelineLeg,
} from '../../interfaces/itinerary';
import { TripsService } from '../../trips/trips.service';
import { CreateStopDto } from '../dto/create-stop.dto';

//TODO: Implement TimelineLeg and TimelineStop interfaces - or figure out a combiined approach to interweave them into the timeline
//TODO: potentially a dto for timeline?

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
   * TODO: We need to interweave stops and legs in order
   * TODO: We also need to incorporate stint/participants and vehicles. Likely sort out new user perms method first
   */

  async getTripTimeline(tripId: number, userId: number): Promise<TripTimeline> {
    // First verify the trip exists and the user has access
    const trip = await this.tripsService.findOne(tripId);

    //Use userId to check if they have access to the trip

    // Get all stints for the trip
    const stints = await this.stintsRepository.find({
      where: { trip_id: tripId },
      relations: ['stops', 'legs', 'start_location', 'end_location'],
      order: { sequence_number: 'ASC' },
    });

    console.log(stints);

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

    if (!stints || stints.length === 0) {
      throw new NotFoundException(`No stints found for trip with ID ${tripId}`);
    }

    for (const stint of stints) {
      // Sort stops by sequence number
      const sortedStops =
        stint.stops?.sort((a, b) => a.sequence_number - b.sequence_number) ||
        [];

      // Sort legs by sequence number
      const sortedLegs =
        stint.legs?.sort((a, b) => a.sequence_number - b.sequence_number) || [];

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
      if (stint.start_location) {
        stintTimeline.start_location_name = stint.start_location.name;
      }

      if (stint.end_location) {
        stintTimeline.end_location_name = stint.end_location.name;
      }

      // Add stops to the stint timeline
      if (sortedStops.length > 0) {
        stintTimeline.stops = sortedStops.map((stop) => ({
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

        // Add legs to the stint timeline
        if (sortedLegs.length > 0) {
          stintTimeline.legs = sortedLegs.map((leg) => ({
            leg_id: leg.leg_id,
            distance: leg.distance,
            estimated_travel_time: leg.estimated_travel_time,
            route_type: leg.route_type,
            polyline: leg.polyline,
            notes: leg.notes,
            start_stop_name: leg.start_stop?.name,
            end_stop_name: leg.end_stop?.name,
          }));

          // Calculate total stint distance and duration as before
          stintTimeline.distance = sortedLegs.reduce(
            (total, leg) => total + leg.distance,
            0,
          );
          stintTimeline.estimated_duration = sortedLegs.reduce(
            (total, leg) => total + leg.estimated_travel_time,
            0,
          );

          // Add stop durations to total stint duration
          if (stintTimeline.estimated_duration) {
            sortedStops.forEach((stop) => {
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
   * Add a new stop to a stint, handle potential re-ordering and update legs automatically
   */
  async addStop(createStopDto: CreateStopDto, userId: number): Promise<Stop> {
    const stint = await this.stintsService.findOne(createStopDto.stint_id);
    if (!stint) {
      throw new NotFoundException(
        `Stint with ID ${createStopDto.stint_id} not found`,
      );
    }

    // Check if user has permission to modify this stint
    const trip = await this.tripsService.findOne(stint.trip_id);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to add stops to this trip',
      );
    }

    // Validate that stint belongs to the trip
    if (stint.trip_id !== createStopDto.trip_id) {
      throw new ForbiddenException(
        'The stint does not belong to the specified trip',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const maxSequence = await this.stopsRepository.findMaxSequenceNumber(
        stint.stint_id,
      );
      // Determine the sequence number if not provided, is 0, or is too high (max + 2)
      if (
        !createStopDto.sequence_number ||
        createStopDto.sequence_number === 0 ||
        createStopDto.sequence_number > maxSequence + 1
      ) {
        createStopDto.sequence_number = maxSequence + 1;
      } else {
        // If inserting at a specific position, shift existing stops
        const stopsToShift = await this.stopsRepository.find({
          where: {
            stint_id: stint.stint_id,
            sequence_number: MoreThanOrEqual(createStopDto.sequence_number),
          },
          order: { sequence_number: 'DESC' },
        });

        for (const stop of stopsToShift) {
          stop.sequence_number += 1;
          await manager.getRepository(Stop).save(stop);
        }
      }

      // Create the stop
      const stopRepo = manager.getRepository(Stop);
      const stop = stopRepo.create(createStopDto);
      const savedStop = await stopRepo.save(stop);

      // Update legs
      await this.updateLegsAfterStopChange(stint.stint_id, manager);

      // Update stint start/end locations if needed
      await this.updateStintStartEndLocations(stint.stint_id, manager);

      return savedStop;
    });
  }

  /**
   * Remove a stop and update sequence numbers, legs, and stint metadata
   */
  async removeStop(stopId: number, userId: number): Promise<void> {
    const stop = await this.stopsService.findOne(stopId);
    if (!stop) {
      throw new NotFoundException(`Stop with ID ${stopId} not found`);
    }

    const trip = await this.tripsService.findOne(stop.trip_id);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to remove stops from this trip',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const stopRepo = manager.getRepository(Stop);

      // Delete the stop
      await stopRepo.remove(stop);

      // Update sequence numbers for stops after the removed one
      const stopsToUpdate = await this.stopsRepository.find({
        where: {
          stint_id: stop.stint_id,
          sequence_number: MoreThan(stop.sequence_number),
        },
        order: { sequence_number: 'ASC' },
      });

      for (const remainingStop of stopsToUpdate) {
        remainingStop.sequence_number -= 1;
        await stopRepo.save(remainingStop);
      }

      // Update legs and stint metadata
      await this.updateLegsAfterStopChange(stop.stint_id, manager);
      await this.updateStintStartEndLocations(stop.stint_id, manager);
    });
  }

  /**
   * Reorder stops within a stint by specifying the new sequence for each stop
   */
  async reorderStops(
    stintId: number,
    stopOrder: { stop_id: number; sequence_number: number }[],
    userId: number,
  ): Promise<void> {
    const stint = await this.stintsService.findOne(stintId);
    if (!stint) {
      throw new NotFoundException(`Stint with ID ${stintId} not found`);
    }

    // Check if user has permission
    const trip = await this.tripsService.findOne(stint.trip_id);
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to modify this stint',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      const stopRepo = manager.getRepository(Stop);

      // Update sequence numbers for each stop
      for (const item of stopOrder) {
        const stop = await this.stopsService.findOne(item.stop_id);

        if (stop.stint_id !== stintId) {
          throw new ForbiddenException(
            `Stop with ID ${stop.stop_id} does not belong to stint ${stintId}`,
          );
        }

        stop.sequence_number = item.sequence_number;
        await stopRepo.save(stop);
      }

      // Update legs and stint metadata
      await this.updateLegsAfterStopChange(stintId, manager);
      await this.updateStintStartEndLocations(stintId, manager);
    });
  }

  /**
   * Update legs after stops have been added, removed, or resequenced
   * We are using manager to ensure that this is done in the same transaction
   * TODO: can we do this with dependency injection?
   */
  private async updateLegsAfterStopChange(
    stintId: number,
    manager: EntityManager,
  ): Promise<void> {
    // Get all stops in the stint, ordered by sequence
    const stops = await this.stopsRepository.find({
      where: { stint_id: stintId },
      order: { sequence_number: 'ASC' },
    });

    if (stops.length <= 1) {
      return; // No legs needed with 0 or 1 stops
    }

    // Delete all existing legs for this stint
    const existingLegs = await this.legsRepository.find({
      where: { stint_id: stintId },
    });

    if (existingLegs.length > 0) {
      await manager.getRepository(Leg).remove(existingLegs);
    }

    // Create new legs between consecutive stops
    const legRepo = manager.getRepository(Leg);
    for (let i = 0; i < stops.length - 1; i++) {
      const currentStop = stops[i];
      const nextStop = stops[i + 1];

      const newLeg = legRepo.create({
        stint_id: stintId,
        start_stop_id: currentStop.stop_id,
        end_stop_id: nextStop.stop_id,
        sequence_number: i + 1,
        distance: 0, // This should be calculated based on coordinates
        estimated_travel_time: 0, // This should be calculated based on distance
      });

      await legRepo.save(newLeg);
    }
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
   * Update the start and end locations of a stint based on its stops
   * This should be called AFTER re-ordering stops
   */
  private async updateStintStartEndLocations(
    stintId: number,
    manager: EntityManager,
  ): Promise<void> {
    const stops = await this.stopsRepository.find({
      where: { stint_id: stintId },
      order: { sequence_number: 'ASC' },
    });

    if (stops.length === 0) {
      return;
    }

    const stint = await this.stintsService.findOne(stintId);
    let updated = false;

    // First stop should be the start location
    if (stint.start_location_id !== stops[0].stop_id) {
      stint.start_location_id = stops[0].stop_id;
      updated = true;
    }

    // Last stop should be the end location
    if (stint.end_location_id !== stops[stops.length - 1].stop_id) {
      stint.end_location_id = stops[stops.length - 1].stop_id;
      updated = true;
    }

    if (updated) {
      await manager.getRepository(Stint).save(stint);
    }
  }
}
