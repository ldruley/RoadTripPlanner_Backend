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

      if (stint.continues_from_previous && stint.start_location) {
        timelineItems.push({
          type: 'stop',
          sequence_number: 0,
          item: {
            stop_id: stint.start_location.stop_id,
            name: stint.start_location.name,
            latitude: stint.start_location.latitude,
            longitude: stint.start_location.longitude,
            address: stint.start_location.address,
            stop_type: StopType.DEPARTURE,
            arrival_time: stint.start_location.arrival_time,
            departure_time:
              stint.start_location.departure_time || stint.start_time,
            duration: stint.start_location.duration,
            sequence_number: 0,
            notes: `Departure from ${stint.start_location.name}`,
          },
        });
      } else {
        // For the first stint, check if there's a departure stop (sequence 0)
        const departureStop = sortedStops.find(
          (stop) => stop.sequence_number === 0,
        );
        if (departureStop) {
          timelineItems.push({
            type: 'stop',
            sequence_number: 0,
            item: {
              stop_id: departureStop.stop_id,
              name: departureStop.name,
              latitude: departureStop.latitude,
              longitude: departureStop.longitude,
              address: departureStop.address,
              stop_type: departureStop.stop_type,
              arrival_time: departureStop.arrival_time,
              departure_time: departureStop.departure_time,
              duration: departureStop.duration,
              sequence_number: departureStop.sequence_number,
              notes: departureStop.notes,
            },
          });
        }
      }

      sortedStops
        .filter((stop) => stop.sequence_number > 0)
        .forEach((stop) => {
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

    if (!createStintWithOptionalStopDto.sequence_number) {
      const newSequence = await this.stintsRepository.findMaxSequenceNumber(
        createStintWithOptionalStopDto.trip_id,
      );
      createStintWithOptionalStopDto.sequence_number = newSequence + 1;
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
        sequence_number: prevStint.end_location_id,
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

      return stintRepo.save(stint);
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
        sequence_number: 0, // First stop in the stint is 0 to match how subsquent stints handle departure
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
   * TODO: Handle if this is the last stop in the stint since it's connected to departure stop for the next stint
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

    if (stop.sequence_number === 0) {
      const stopCount = await this.stopsRepository.count({
        where: { stint_id: stop.stint_id },
      });

      if (stopCount === 1) {
        throw new ForbiddenException(
          'Cannot remove the departure stop when it is the only stop in the stint',
        );
      }
    }

    return this.dataSource
      .transaction(async (manager) => {
        const stopRepo = manager.getRepository(Stop);
        const legRepo = manager.getRepository(Leg);
        const stintRepo = manager.getRepository(Stint);

        // Legs need to be deleted prior to removing the stop
        // TODO: maybe not now actually
        const relatedLegs = await legRepo.find({
          where: [{ start_stop_id: stopId }, { end_stop_id: stopId }],
        });

        if (relatedLegs.length > 0) {
          await legRepo.remove(relatedLegs);
        }

        // If this is the first stop in the stint we need to update
        if (stop.sequence_number === 0) {
          const stint = await stintRepo.findOne({
            where: { stint_id: stop.stint_id },
          });
          if (!stint) {
            throw new NotFoundException(
              `Stint with ID ${stop.stint_id} not found`,
            );
          }

          // Find the next stop to become the new start location
          const nextStop = await stopRepo.findOne({
            where: { stint_id: stop.stint_id, sequence_number: 1 },
          });

          if (nextStop) {
            stint.start_location_id = nextStop.stop_id;
            await stintRepo.save(stint);
          }
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
        await this.updateStintTimings(stop.stint_id, manager);
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
        await this.updateStintTimings(stintId, manager);
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
   * TODO: maybe come back to this approach, check api if we can get legs in a single call
   */
  /* private async updateLegsAfterStopChanges(
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
  }*/

  private async updateLegsAfterStopChanges(
    stintId: number,
    stopsChanged: Stop[] | undefined,
    manager: EntityManager,
  ): Promise<void> {
    if (!stopsChanged || stopsChanged.length === 0) {
      return;
    }

    const stops = await manager.getRepository(Stop).find({
      where: { stint_id: stintId },
      order: { sequence_number: 'ASC' },
    });

    const legRepo = manager.getRepository(Leg);

    // Delete all existing legs for this stint to rebuild them
    const existingLegs = await legRepo.find({
      where: { stint_id: stintId },
    });
    if (existingLegs.length > 0) {
      await legRepo.remove(existingLegs);
    }

    // Filter out departure stop (sequence_number = 0) for leg creation
    const regularStops = stops.filter((stop) => stop.sequence_number > 0);

    // Create legs between consecutive stops
    for (let i = 0; i < regularStops.length - 1; i++) {
      const currentStop = regularStops[i];
      const nextStop = regularStops[i + 1];

      const leg = legRepo.create({
        stint_id: stintId,
        start_stop_id: currentStop.stop_id,
        end_stop_id: nextStop.stop_id,
        sequence_number: currentStop.sequence_number, // This will be 1, 2, 3...
        distance: 10, // This should be calculated based on API calls
        estimated_travel_time: 10, // This should be calculated based on API calls
      });

      await legRepo.save(leg);
    }

    // If there's a departure stop (sequence 0) and at least one regular stop,
    // create a leg from departure to first regular stop
    const departureStop = stops.find((stop) => stop.sequence_number === 0);
    if (departureStop && regularStops.length > 0) {
      const firstRegularStop = regularStops[0];

      const departureLeg = legRepo.create({
        stint_id: stintId,
        start_stop_id: departureStop.stop_id,
        end_stop_id: firstRegularStop.stop_id,
        sequence_number: 0, // Special sequence number for departure leg
        distance: 10, // This should be calculated based on API calls
        estimated_travel_time: 10, // This should be calculated based on API calls
        notes: 'Departure leg',
      });

      await legRepo.save(departureLeg);
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
   * Update all arrival and departure times for a stint based on legs and stop durations
   * This should be called after any stop changes or leg updates
   */
  private async updateStintTimings(
    stintId: number,
    manager: EntityManager,
  ): Promise<void> {
    const stint = await manager.getRepository(Stint).findOne({
      where: { stint_id: stintId },
      relations: ['start_location'],
    });

    if (!stint) {
      throw new NotFoundException(`Stint with ID ${stintId} not found`);
    }

    const stops = await manager.getRepository(Stop).find({
      where: { stint_id: stintId },
      order: { sequence_number: 'ASC' },
    });

    const legs = await manager.getRepository(Leg).find({
      where: { stint_id: stintId },
      order: { sequence_number: 'ASC' },
    });

    if (stops.length === 0) {
      return;
    }

    let currentTime = stint.start_time;
    if (!currentTime) {
      // If no start_time is set, we can't calculate timings
      return;
    }

    // Handle the departure stop (sequence 0)
    const departureStop = stops.find((stop) => stop.sequence_number === 0);
    if (departureStop) {
      departureStop.arrival_time = currentTime;
      if (departureStop.duration) {
        departureStop.departure_time = DateUtils.addMinutes(
          currentTime,
          departureStop.duration,
        );
        currentTime = departureStop.departure_time;
      } else {
        departureStop.departure_time = currentTime;
      }
      await manager.getRepository(Stop).save(departureStop);
    }

    // Process each regular stop
    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];

      if (stop.sequence_number === 0) {
        continue; // Already handled departure stop
      }

      // Find the leg that arrives at this stop
      const incomingLeg = legs.find((leg) => leg.end_stop_id === stop.stop_id);

      if (incomingLeg) {
        // Calculate arrival time based on previous stop's departure + leg travel time
        stop.arrival_time = DateUtils.addMinutes(
          currentTime,
          incomingLeg.estimated_travel_time,
        );
        currentTime = stop.arrival_time;
      } else {
        // If no incoming leg, use current time
        stop.arrival_time = currentTime;
      }

      // Calculate departure time based on arrival + duration
      if (stop.duration) {
        stop.departure_time = DateUtils.addMinutes(
          stop.arrival_time,
          stop.duration,
        );
        currentTime = stop.departure_time;
      } else {
        stop.departure_time = stop.arrival_time;
      }

      await manager.getRepository(Stop).save(stop);
    }

    // Update stint end time
    if (stops.length > 0) {
      const lastStop = stops[stops.length - 1];
      stint.end_time = lastStop.departure_time;
      await manager.getRepository(Stint).save(stint);
    }
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

    const departureStop = stops.find((stop) => stop.sequence_number === 0);
    if (departureStop) {
      if (stint.start_location_id !== departureStop.stop_id) {
        stint.start_location_id = departureStop.stop_id;
        updated = true;
      }
    } else {
      const firstStop = stops[0];
      if (stint.start_location_id !== firstStop.stop_id) {
        stint.start_location_id = firstStop.stop_id;
        updated = true;
      }
    }

    if (updated) {
      await manager.getRepository(Stint).save(stint);
    }
  }
}
