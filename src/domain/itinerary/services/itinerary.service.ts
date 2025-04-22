import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
  BadRequestException,
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
  TimelineItem,
  //TimelineStop,
  //TimelineLeg,
} from '../../interfaces/itinerary';
import { TripsService } from '../../trips/trips.service';
import { CreateStopDto } from '../dto/create-stop.dto';
import { CreateStintDto } from '../dto/create-stint-dto';
import { CreateStintWithStopDto } from '../dto/create-stint-with-stop.dto';
import { CreateStintWithOptionalStopDto } from '../dto/create-sprint-with-optional-stop.dto';
import { DateUtils } from '../../../common/utils';
import { StopType } from '../../../common/enums';

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

    //TODO: We need to check if they have access to the trip, currently passed userId but we also need to check if they are a participant

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
        timeline: [],
      };
      if (stint.start_location) {
        stintTimeline.start_location_name = stint.start_location.name;
      }

      if (stint.end_location) {
        stintTimeline.end_location_name = stint.end_location.name;
      }

      const timelineItems: TimelineItem[] = [];

      sortedStops.forEach((stop) => {
        timelineItems.push({
          type: 'stop',
          sequence_number: stop.sequence_number,
          item: {
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
          },
        });
      });

      sortedLegs.forEach((leg) => {
        timelineItems.push({
          type: 'leg',
          // Setting sequence number to n + 0.5 to interleave with stops
          sequence_number: leg.sequence_number + 0.5,
          item: {
            leg_id: leg.leg_id,
            distance: leg.distance,
            estimated_travel_time: leg.estimated_travel_time,
            route_type: leg.route_type,
            polyline: leg.polyline,
            notes: leg.notes,
            start_stop_name: leg.start_stop?.name,
            end_stop_name: leg.end_stop?.name,
          },
        });
      });

      timelineItems.sort((a, b) => a.sequence_number - b.sequence_number);

      stintTimeline.timeline = timelineItems;

      // TODO: we shouldn't need to do this anymore, but let's check
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
   * Create a new stint with an optional initial stop
   * This method is called when creating a new stint
   * It checks if the stint is the first in a trip or if it continues from a previous stint
   */
  async createStint(
    createStintWithOptionalStopDto: CreateStintWithOptionalStopDto,
    userId: number,
  ): Promise<Stint> {
    const trip = await this.tripsService.findOne(
      createStintWithOptionalStopDto.trip_id,
    );
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create stints in this trip',
      );
    }

    // Find previous stint
    const prevStint = await this.stintsRepository.findOne({
      where: {
        trip_id: createStintWithOptionalStopDto.trip_id,
        sequence_number: createStintWithOptionalStopDto.sequence_number - 1,
      },
      relations: ['stops'],
    });

    if (!prevStint) {
      // If no previous stint, use regular creation logic
      return this.createStintWithInitialStop(
        createStintWithOptionalStopDto,
        userId,
      );
    }

    // Get the last stop of the previous stint
    const lastStop = await this.stopsRepository.findOne({
      where: {
        stint_id: prevStint.stint_id,
        sequence_number: prevStint.stops.length,
      },
    });

    if (!lastStop) {
      throw new Error('Previous stint has no stops');
    }

    return this.dataSource.transaction(async (manager) => {
      const stintRepo = manager.getRepository(Stint);

      const stint = stintRepo.create({
        ...createStintWithOptionalStopDto,
        start_time: lastStop.departure_time || lastStop.arrival_time,
        start_location_id: lastStop.stop_id,
        continues_from_previous: true,
      });

      const savedStint = await stintRepo.save(stint);

      // addtl logic to handle the transition maybe

      return savedStint;
    });
  }

  /**
   * Create a new stint with an initial stop
   * This method is called when creating a the first stint in a trip
   */
  async createStintWithInitialStop(
    createStintWithStopDto: CreateStintWithOptionalStopDto,
    userId: number,
  ): Promise<Stint> {
    // Use transaction to ensure both stop and stint are created or neither is
    return this.dataSource.transaction(async (manager) => {
      if (!createStintWithStopDto.initialStop) {
        throw new BadRequestException(
          'Initial stop is required since this is a new stint',
        );
      }

      //TODO: maybe some other way to handle this
      if (!createStintWithStopDto.start_time) {
        throw new BadRequestException(
          'Start time is required since this is a new stint',
        );
      }

      // Create the initial stop first
      const stopToCreate = {
        name: createStintWithStopDto.initialStop.name,
        latitude: createStintWithStopDto.initialStop.latitude,
        longitude: createStintWithStopDto.initialStop.longitude,
        address: createStintWithStopDto.initialStop.address,
        stop_type: StopType.DEPARTURE,
        sequence_number: 1, // First stop in the stint
        notes: createStintWithStopDto.initialStop.notes,
        trip_id: createStintWithStopDto.trip_id,
        arrival_time: createStintWithStopDto.start_time,
        departure_time: DateUtils.addMinutes(
          createStintWithStopDto.start_time,
          createStintWithStopDto.initialStop.duration || 0,
        ),
        duration: createStintWithStopDto.initialStop.duration,
        stint_id: null, // We'll update this after creating the stint
      };

      const stop = await this.stopsService.createWithTransaction(
        stopToCreate,
        manager,
      );

      // Create the stint with the stop_id already available
      const stintToCreate = {
        name: createStintWithStopDto.name,
        sequence_number: createStintWithStopDto.sequence_number,
        trip_id: createStintWithStopDto.trip_id,
        notes: createStintWithStopDto.notes,
        start_location_id: stop.stop_id,
        start_time: createStintWithStopDto.start_time,
      };

      const stintRepo = manager.getRepository(Stint);
      const stint = stintRepo.create(stintToCreate);
      const savedStint = await stintRepo.save(stint);

      // Update the stop with the stint_id
      stop.stint_id = savedStint.stint_id;
      await manager.getRepository(Stop).save(stop);

      return savedStint;
    });
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

    const maxSequence = await this.stopsRepository.findMaxSequenceNumber(
      stint.stint_id,
    );

    return this.dataSource
      .transaction(async (manager) => {
        const stopRepo = manager.getRepository(Stop);

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
            await stopRepo.save(stop);
          }
        }

        // Create the stop

        const stop = stopRepo.create(createStopDto);
        const savedStop = await stopRepo.save(stop);

        // Update legs and stint metadata
        await this.updateLegsAfterStopChanges(
          savedStop.stint_id,
          [savedStop],
          manager,
        );
        await this.updateStintStartEndLocations(stint.stint_id, manager);

        return savedStop;
      })
      .then((savedStop) => {
        this.updateStintDuration(savedStop.stint_id).catch((error) => {
          console.error(
            `Failed to update stint duration for stint ID ${savedStop.stint_id}: ${error}`,
          );
        });
        this.updateStintDistance(savedStop.stint_id).catch((error) => {
          console.error(
            `Failed to update stint distance for stint ID ${savedStop.stint_id}: ${error}`,
          );
        });
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

    return this.dataSource
      .transaction(async (manager) => {
        const stopRepo = manager.getRepository(Stop);
        const legRepo = manager.getRepository(Leg);
        const stintRepo = manager.getRepository(Stint);

        // Legs need to be deleted prior to removing the stop
        const relatedLegs = await legRepo.find({
          where: [{ start_stop_id: stopId }, { end_stop_id: stopId }],
        });

        if (relatedLegs.length > 0) {
          await legRepo.remove(relatedLegs);
        }

        // If this is the first stop in the stint we need to update
        if (stop.sequence_number === 1) {
          const stint = await stintRepo.findOne({
            where: { stint_id: stop.stint_id },
          });
          if (!stint) {
            throw new NotFoundException(
              `Stint with ID ${stop.stint_id} not found`,
            );
          }
          const stops = await stopRepo.find({
            where: { stint_id: stop.stint_id },
            order: { sequence_number: 'ASC' },
            take: 2,
          });
          if (!stops || stops.length === 0) {
            throw new NotFoundException(
              `No stops found or this is the only stop for stint with ID ${stop.stint_id}`,
            );
          }
          stint.start_location_id = stops[1].stop_id;
          await stintRepo.save(stint);
        }

        // Delete the stop
        await stopRepo.remove(stop);

        // Update sequence numbers for stops after the removed one
        const stopsToUpdate = await stopRepo.find({
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

        //Get previous stop to send for updating legs
        const previousStop = await stopRepo.findOne({
          where: {
            stint_id: stop.stint_id,
            sequence_number: stop.sequence_number - 1,
          },
        });

        // Update legs and stint metadata
        await this.updateLegsAfterStopChanges(
          stop.stint_id,
          previousStop ? [previousStop] : undefined,
          manager,
        );
        await this.updateStintStartEndLocations(stop.stint_id, manager);
      })
      .then(() => {
        this.updateStintDuration(stop.stint_id).catch((error) => {
          console.error(
            `Failed to update stint duration for stint ID ${stop.stint_id}: ${error}`,
          );
        });
        this.updateStintDistance(stop.stint_id).catch((error) => {
          console.error(
            `Failed to update stint distance for stint ID ${stop.stint_id}: ${error}`,
          );
        });
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

    return this.dataSource
      .transaction(async (manager) => {
        const stopRepo = manager.getRepository(Stop);
        const savedStops: Stop[] = [];
        // Update sequence numbers for each stop
        for (const item of stopOrder) {
          const stop = await this.stopsService.findOne(item.stop_id);

          if (stop.stint_id !== stintId) {
            throw new ForbiddenException(
              `Stop with ID ${stop.stop_id} does not belong to stint ${stintId}`,
            );
          }
          savedStops.push(stop);
          stop.sequence_number = item.sequence_number;
          await stopRepo.save(stop);
        }

        // Update legs and stint metadata
        await this.updateLegsAfterStopChanges(stintId, savedStops, manager);
        await this.updateStintStartEndLocations(stintId, manager);
      })
      .then(() => {
        this.updateStintDuration(stintId).catch((error) => {
          console.error(
            `Failed to update stint duration for stint ID ${stintId}: ${error}`,
          );
        });
        this.updateStintDistance(stintId).catch((error) => {
          console.error(
            `Failed to update stint distance for stint ID ${stintId}: ${error}`,
          );
        });
      });
  }

  /**
   * Update legs after stops have been added, removed, or resequenced
   * We are using manager to ensure that this is done in the same transaction
   * TODO: this is inefficient as we are getting all the stops and then checking each leg if it exists
   * TODO: need to consider all the updating required with stop changes and where we can potentially combine updates
   */
  private async updateLegsAfterStopChanges(
    stintId: number,
    stopsChanged: Stop[] | undefined,
    manager: EntityManager,
  ): Promise<void> {
    // If undefined or empty, no need to update legs - this should represent a removal of the first stop.
    if (!stopsChanged || stopsChanged.length === 0) {
      return;
    }

    // Get all stops in the stint, ordered by sequence
    const stops = await manager.getRepository(Stop).find({
      where: { stint_id: stintId },
      order: { sequence_number: 'ASC' },
    });

    const legRepo = manager.getRepository(Leg);

    // No legs needed with 0 or 1 stops - make sure we have no leftover legs in this case.
    if (stops.length <= 1) {
      const existingLegs = await legRepo.find({
        where: { stint_id: stintId },
      });
      if (existingLegs.length > 0) {
        await legRepo.remove(existingLegs);
      }
      return;
    }

    // Get affected legs based on passed stops and remove them
    // TODO: they may already be removed, if this method is called from stop removal
    let affectedLegs: Leg[] = [];
    for (const stop of stopsChanged) {
      const legs = await legRepo.find({
        where: [{ start_stop_id: stop.stop_id }, { end_stop_id: stop.stop_id }],
      });
      affectedLegs = [...affectedLegs, ...legs];
    }

    // Remove affected legs
    if (affectedLegs.length > 0) {
      await legRepo.remove(affectedLegs);
    }

    // Get all remaining legs to update their sequence numbers if needed
    // Approach is different that stops as it's more complex to determine
    const remainingLegs = await legRepo.find({
      where: { stint_id: stintId },
      order: { sequence_number: 'ASC' },
    });

    // Create a map of stop_id to sequence_number for quick lookup
    const stopSequenceMap = new Map<number, number>();
    stops.forEach((stop) => {
      stopSequenceMap.set(stop.stop_id, stop.sequence_number);
    });

    // Update sequence numbers of remaining legs based on their starting stop's sequence
    for (const leg of remainingLegs) {
      const startStopSequence = stopSequenceMap.get(leg.start_stop_id);
      if (
        startStopSequence !== undefined &&
        leg.sequence_number !== startStopSequence
      ) {
        leg.sequence_number = startStopSequence;
        await legRepo.save(leg);
      }
    }

    // Create new legs between consecutive stops
    for (let i = 0; i < stops.length - 1; i++) {
      const currentStop = stops[i];
      const nextStop = stops[i + 1];

      const leg = await legRepo.findOne({
        where: {
          start_stop_id: currentStop.stop_id,
          end_stop_id: nextStop.stop_id,
        },
      });

      if (!leg) {
        const newLeg = legRepo.create({
          stint_id: stintId,
          start_stop_id: currentStop.stop_id,
          end_stop_id: nextStop.stop_id,
          sequence_number: currentStop.sequence_number,
          distance: 10, // This should be calculated based on api calls
          estimated_travel_time: 10, // This should be calculated based on api calls
        });

        await legRepo.save(newLeg);
      }
    }
  }

  /**
   * Calculate and update total distance for a stint
   * This is not critical, so we can call this outside a transaction
   */
  async updateStintDistance(stintId: number): Promise<void> {
    const totalDistance =
      await this.legsRepository.sumEstimatedTravelDistance(stintId);

    // Update the stint with the new distance
    const stint = await this.stintsService.findOne(stintId);
    stint.distance = totalDistance;
    await this.stintsRepository.save(stint);
  }

  /**
   * Calculate and update total duration for a stint
   * This is not critical, so we can call this outside a transaction
   */
  async updateStintDuration(stintId: number): Promise<void> {
    const legDuration =
      await this.legsRepository.sumEstimatedTravelTime(stintId);
    const stopDuration = await this.stopsRepository.sumDuration(stintId);
    // Update the stint with the new duration
    const stint = await this.stintsService.findOne(stintId);
    stint.estimated_duration = legDuration + stopDuration;
    await this.stintsRepository.save(stint);
  }

  /**
   * Update the start and end locations of a stint based on its stops
   * This should be called AFTER re-ordering stops
   * This method is called inside a transaction to ensure data consistency
   */
  private async updateStintStartEndLocations(
    stintId: number,
    manager: EntityManager,
  ): Promise<void> {
    const stops = await manager.getRepository(Stop).find({
      where: { stint_id: stintId },
      order: { sequence_number: 'ASC' },
    });

    if (stops.length === 0) {
      return;
    }

    const stint = await manager.getRepository(Stint).findOne({
      where: { stint_id: stintId },
    });
    let updated = false;
    if (!stint) {
      throw new NotFoundException(
        `Stint with ID ${stintId} not found while updating stint locations.`,
      );
    }
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
