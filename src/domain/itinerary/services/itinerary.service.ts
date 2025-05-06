import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { StintsService } from './stints.service';
import { StopsService } from './stops.service';
import { LegsService } from './legs.service';
import { Stint } from '../entities/stint.entity';
import { Stop } from '../entities/stop.entity';
import { Leg } from '../entities/leg.entity';
import { TimelineEventModel } from '../../interfaces/itinerary';
import { TripsService } from '../../trips/services/trips.service';
import { CreateStopDto } from '../dto/create-stop.dto';
import { CreateStintDto } from '../dto/create-stint-dto';
import { CreateStintWithStopDto } from '../dto/create-stint-with-stop.dto';
import { CreateStintWithOptionalStopDto } from '../dto/create-sprint-with-optional-stop.dto';
import { DateUtils } from '../../../common/utils';
import { StopType } from '../../../common/enums';
import { InjectRepository } from '@nestjs/typeorm';
import { LocationsService } from '../../locations/locations.service';
import { CreateLocationDto } from '../../locations/dto/create-location.dto';
import { plainToInstance } from 'class-transformer';
import { TripTimelineResponseDto } from '../../trips/dto/trip-timeline-response.dto';
import { TripTimelineModel } from '../../interfaces/itinerary/trip-timeline.interface';
import { StintTimelineModel } from '../../interfaces/itinerary/trip-timeline-stint.interface';
import { Trip } from '../../trips/entities/trip.entity';
import { TripParticipant } from '../../trips/entities/trip-participant.entity';
import { StintVehicle } from '../entities/stint-vehicle.entity';
import { TripSupply } from '../../trips/entities/trip.supplies.entity';

//TODO: Implement TimelineLeg and TimelineStop interfaces - or figure out a combiined approach to interweave them into the timeline
//TODO: potentially a dto for timeline?

@Injectable()
export class ItineraryService {
  constructor(
    @InjectRepository(Stint)
    private stintRepository: Repository<Stint>,

    @Inject(forwardRef(() => TripsService))
    private tripsService: TripsService,
    private stintsService: StintsService,
    private stopsService: StopsService,
    private legsService: LegsService,
    private locationsService: LocationsService,
    private dataSource: DataSource,
  ) {}

  /**
   * Get a complete trip timeline including all stints, stops, and legs
   * TODO: We need to incorporate stint/participants and vehicles. Likely sort out new user perms method first
   */

  private async ensureUserCanAccessTrip(
    tripId: number,
    userId: number,
  ): Promise<void> {
    const trip = await this.tripsService.findOne(tripId);
    if (!trip) throw new NotFoundException(`Trip ${tripId} not found`);

    const hasAccess = await this.tripsService.checkUserInTrip(tripId, userId);
    if (!hasAccess)
      throw new ForbiddenException(`No permission to view trip ${tripId}`);
  }

  async getTripTimeline(
    tripId: number,
    userId: number,
  ): Promise<TripTimelineResponseDto> {
    await this.ensureUserCanAccessTrip(tripId, userId);

    const stints = await this.stintsService.findAllByTripWithRelations(tripId);
    const trip = await this.tripsService.findOneOrThrow({ trip_id: tripId });
    if (!stints.length) {
      throw new NotFoundException(`No stints found for trip ${tripId}`);
    }

    const tripParticipants = await this.dataSource
      .getRepository(TripParticipant)
      .find({
        where: { trip_id: tripId },
        relations: ['user'],
      });

    const tripSupplies = await this.dataSource.getRepository(TripSupply).find({
      where: { tripId },
      relations: ['supply'],
    });

    const timelineModel = this.buildTripTimeline(trip, stints);

    timelineModel.participants = tripParticipants.map((participant) => ({
      user_id: participant.user.user_id,
      username: participant.user.username,
      fullname: participant.user.fullname,
      role: participant.role,
      joined_at: this.formatDateToIso(participant.joined_at) ?? '',
    }));

    timelineModel.supplies = tripSupplies.map((tripSupply) => ({
      supply_id: tripSupply.supply.supply_id,
      name: tripSupply.supply.name,
      category: tripSupply.supply.category,
      quantity: tripSupply.quantity,
      notes: tripSupply.notes || undefined,
    }));

    for (const stint of timelineModel.stints) {
      // Load stint vehicles
      const stintVehicles = await this.dataSource
        .getRepository(StintVehicle)
        .find({
          where: { stint_id: stint.stintId },
          relations: ['vehicle', 'driver'],
        });

      // Add vehicles to stint
      stint.vehicles = stintVehicles.map((sv) => ({
        vehicle_id: sv.vehicle.vehicle_id,
        name: sv.vehicle.name,
        year: sv.vehicle.year,
        driver: sv.driver
          ? {
              user_id: sv.driver.user_id,
              username: sv.driver.username,
              fullname: sv.driver.fullname,
            }
          : undefined,
      }));
    }

    return plainToInstance(TripTimelineResponseDto, timelineModel);
  }
  private buildTripTimeline(trip: Trip, stints: Stint[]): TripTimelineModel {
    const timeline: TripTimelineModel = {
      tripId: trip.trip_id,
      title: trip.title,
      description: trip.description,
      startDate: this.formatDateToIso(trip.start_date),
      endDate: this.formatDateToIso(trip.end_date),
      totalDistance: 0,
      totalDuration: 0,
      stints: [],
      participants: [],
      supplies: [],
    };

    const legsByStops = new Map<string, Leg>();

    for (const stint of stints) {
      for (const leg of stint.legs ?? []) {
        legsByStops.set(`${leg.start_stop_id}_${leg.end_stop_id}`, leg);
      }
    }

    for (const stint of stints) {
      const stintTimeline = this.buildTimelineForStint(stint, legsByStops);

      timeline.stints.push(stintTimeline);
      timeline.totalDistance += stintTimeline.distance ?? 0;
      timeline.totalDuration += stintTimeline.estimatedDuration ?? 0;
    }

    return timeline;
  }

  private buildTimelineForStint(
    stint: Stint,
    legsByStops: Map<string, Leg>,
  ): StintTimelineModel {
    const sortedStops = [...(stint.stops ?? [])].sort(
      (a, b) => a.sequence_number - b.sequence_number,
    );

    const events: TimelineEventModel[] = [];

    if (stint.start_location) {
      events.push(this.buildDepartureEvent(stint));
    }

    if (stint.start_location) {
      const firstLeg = stint.legs?.find(
        (l) => l.start_location_id === stint.start_location_id,
      );
      if (firstLeg) {
        events.push(
          this.buildLegEvent(
            firstLeg,
            stint.start_location.name,
            firstLeg.end_stop?.name,
            0.5,
          ),
        );
      }
    }

    sortedStops.forEach((stop, index) => {
      events.push(this.buildStopEvent(stop));

      if (index < sortedStops.length - 1) {
        const nextStop = sortedStops[index + 1];
        const connectingLeg = legsByStops.get(
          `${stop.stop_id}_${nextStop.stop_id}`,
        );
        if (connectingLeg) {
          events.push(
            this.buildLegEvent(
              connectingLeg,
              stop.name,
              nextStop.name,
              stop.sequence_number + 0.5,
            ),
          );
        }
      }
    });

    return {
      stintId: stint.stint_id,
      name: stint.name,
      sequenceNumber: stint.sequence_number,
      distance: stint.distance,
      estimatedDuration: stint.estimated_duration,
      notes: stint.notes,
      timeline: events.sort((a, b) => a.sequenceNumber - b.sequenceNumber),
      continuesFromPrevious: stint.continues_from_previous,
      startTime: this.formatDateToIso(stint.start_time),
      endTime: this.formatDateToIso(stint.end_time),
      startLocationName: stint.start_location?.name,
      endLocationName: stint.end_location?.name,
      vehicles: [],
    };
  }

  private buildStopEvent(stop: Stop): TimelineEventModel {
    return {
      type: 'stop',
      sequenceNumber: stop.sequence_number,
      data: {
        stop_id: stop.stop_id,
        location_id: stop.location_id,
        name: stop.name,
        latitude: stop.location.latitude,
        longitude: stop.location.longitude,
        address: stop.location.address || '',
        stop_type: stop.stop_type,
        arrival_time: this.formatDateToIso(stop.arrival_time),
        departure_time: this.formatDateToIso(stop.departure_time),
        duration: stop.duration,
        sequence_number: stop.sequence_number,
        notes: stop.notes,
      },
    };
  }

  private buildLegEvent(
    leg: Leg,
    startStopName: string,
    endStopName: string,
    sequenceNumber: number,
  ): TimelineEventModel {
    return {
      type: 'leg',
      sequenceNumber,
      data: {
        leg_id: leg.leg_id,
        distance: leg.distance,
        estimated_travel_time: leg.estimated_travel_time,
        route_type: leg.route_type,
        polyline: leg.polyline,
        notes: leg.notes,
        start_stop_name: startStopName,
        end_stop_name: endStopName,
      },
    };
  }

  private buildDepartureEvent(stint: Stint): TimelineEventModel {
    return {
      type: 'departure',
      sequenceNumber: 0,
      data: {
        stop_id: 0,
        location_id: stint.start_location_id,
        name: stint.start_location?.name ?? 'Start',
        latitude: stint.start_location?.latitude ?? 0,
        longitude: stint.start_location?.longitude ?? 0,
        address: stint.start_location?.address ?? '',
        stop_type: StopType.DEPARTURE,
        arrival_time: this.formatDateToIso(stint.start_time),
        departure_time: this.formatDateToIso(stint.start_time),
        duration: 0,
        sequence_number: 0,
        notes: `Departure from ${stint.start_location?.name}`,
      },
    };
  }

  /**
   * Create a new stint with optional initial stop
   */
  async createStint(
    dto: CreateStintWithOptionalStopDto,
    userId: number,
  ): Promise<Stint> {
    // Validate trip access
    const trip = await this.tripsService.findOne(dto.trip_id);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${dto.trip_id} not found`);
    }
    if (trip.creator_id !== userId) {
      throw new ForbiddenException(
        'You do not have permission to create stints in this trip',
      );
    }

    // Determine sequence number if not provided
    if (!dto.sequence_number) {
      dto.sequence_number = await this.stintsService.getNextSequenceNumber(
        dto.trip_id,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      let stint: Stint;
      let continues_from_previous = false;
      let start_location_id: number | null = null;
      let start_time: Date | undefined = dto.start_time;
      if (!dto.sequence_number) dto.sequence_number = 1;
      // Check if this is continuing from a previous stint
      if (dto.sequence_number > 1) {
        const prevStint = await manager.getRepository(Stint).findOne({
          where: {
            trip_id: dto.trip_id,
            sequence_number: dto.sequence_number - 1,
          },
          relations: ['stops'],
        });

        // If previous stint exists, use its last stop as start location
        if (prevStint && prevStint.end_location_id) {
          start_location_id = prevStint.end_location_id;
          continues_from_previous = true;

          // Get the end time of the previous stint as the start time for this one
          if (prevStint.end_time) {
            start_time = prevStint.end_time;
          }
        }
      }

      // Create the stint
      stint = await this.stintsService.create(
        {
          name: dto.name,
          sequence_number: dto.sequence_number,
          trip_id: dto.trip_id,
          notes: dto.notes,
          continues_from_previous: continues_from_previous,
          start_time: start_time,
        },
        manager,
      );

      // If we need to create an initial stop
      if (dto.initialStop) {
        // If we already have a start location from previous stint, warn that we're ignoring it
        if (start_location_id) {
          console.warn(
            `Initial stop provided for stint ${stint.stint_id} which continues from a previous stint. Using provided stop.`,
          );
        }

        if (!dto.start_time) {
          dto.start_time = new Date();
          console.warn('Start time not provided, using current time');
        }

        const createLocationDto: CreateLocationDto = {
          name: dto.initialStop.name,
          latitude: dto.initialStop.latitude,
          longitude: dto.initialStop.longitude,
          address: dto.initialStop.address,
          city: dto.initialStop.city,
          state: dto.initialStop.state,
          country: dto.initialStop.country,
          postal_code: dto.initialStop.postal_code,
        };

        const savedLocation = await this.locationsService.createLocation(
          createLocationDto,
          userId,
          manager,
        );

        stint = await this.stintsService.updateLocationReferences(
          stint,
          { start_location_id: savedLocation.location_id },
          manager,
        );
      }
      // If we have a start location from previous stint
      else if (start_location_id) {
        stint = await this.stintsService.updateLocationReferences(
          stint,
          { start_location_id: start_location_id },
          manager,
        );
      }

      return stint;
    });
  }

  /**
   * Add a new stop to a stint, handle potential re-ordering and update legs automatically
   */
  async addStop(createStopDto: CreateStopDto, userId: number): Promise<Stop> {
    const stint = await this.stintsService.findByIdWithRelationsOrThrow(
      createStopDto.stint_id,
    );
    if (!stint) {
      throw new NotFoundException(
        `Stint with ID ${createStopDto.stint_id} not found`,
      );
    }

    // Check if user has permission to modify this stint
    const trip = await this.tripsService.findOne(stint.trip_id);
    if (!trip) {
      throw new NotFoundException(`Trip with ID ${stint.trip_id} not found`);
    }
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

    return this.dataSource
      .transaction(async (manager) => {
        // Use the refactored StopsService method
        const stop = await this.stopsService.create(
          createStopDto,
          userId,
          manager,
        );

        // Coordination logic

        await this.updateLegsAfterStopChanges(stop.stint_id, [stop], manager);
        console.log('updatedlegs');
        await this.stintsService.updateLocationReferences(
          stint,
          { end_location_id: stop.location_id },
          manager,
        );
        console.log('updated location references');
        await this.recalculateStintTimeline(stint.stint_id, manager);

        return stop;
      })
      .then((savedStop) => {
        this.updateStintDuration(savedStop.stint_id).catch((error) =>
          console.error(
            `Failed to update stint duration for stint ID ${savedStop.stint_id}: ${error}`,
          ),
        );
        this.updateStintDistance(savedStop.stint_id).catch((error) =>
          console.error(
            `Failed to update stint distance for stint ID ${savedStop.stint_id}: ${error}`,
          ),
        );
        return savedStop;
      });
  }

  /**
   * Remove a stop and update sequence numbers, legs, and stint metadata
   * TODO: Handle if this is the last stop in the stint since it's connected to departure stop for the next stint
   */
  async removeStop(stopId: number, userId: number): Promise<void> {
    const stop = await this.stopsService.findById(stopId);
    if (!stop) {
      throw new NotFoundException(`Stop with ID ${stopId} not found`);
    }

    const stint = await this.stintsService.findByIdWithRelationsOrThrow(
      stop.stint_id,
    );

    await this.tripsService.checkUserInTrip(stint.trip_id, userId);

    // Check if this is the only stop in the stint
    const stopCount = await this.stopsService.countByStint(stop.stint_id);
    if (stopCount <= 1) {
      throw new ForbiddenException(
        'Cannot remove the only stop in a stint. Delete the entire stint instead.',
      );
    }

    return this.dataSource
      .transaction(async (manager) => {
        const stintRepo = manager.getRepository(Stint);
        const legRepo = manager.getRepository(Leg);
        const stopRepo = manager.getRepository(Stop);

        // Find and delete all legs that reference this stop
        const affectedLegs = await legRepo.find({
          where: [{ start_stop_id: stopId }, { end_stop_id: stopId }],
        });

        if (affectedLegs.length > 0) {
          await legRepo.remove(affectedLegs);
        }

        // Get the sequence number for shifting
        const deletedSequence = stop.sequence_number;
        await stopRepo.remove(stop);

        await this.stopsService.shiftStopSequences(
          stop.stint_id,
          deletedSequence + 1, // Start from the next sequence number
          -1, // Shift down by 1
          manager,
        );

        // Get updated list of stops
        const remainingStops = await stopRepo.find({
          where: { stint_id: stop.stint_id },
          order: { sequence_number: 'ASC' },
        });

        if (remainingStops.length > 0) {
          // Update legs between all stops
          await this.updateLegsAfterStopChanges(
            stop.stint_id,
            remainingStops,
            manager,
          );
          console.log('Updated legs after stop changes');
          // Update stint start/end locations
          const lastStop = remainingStops[remainingStops.length - 1];
          console.log(lastStop);
          await stintRepo.update(stint.stint_id, {
            end_location_id: lastStop.location_id,
          });

          // Recalculate timeline
          await this.recalculateStintTimeline(stint.stint_id, manager);
        } else {
          stint.end_location_id = stint.start_location_id;
          await stintRepo.save(stint);
        }
      })
      .then(() => {
        // Update duration and distance calculations
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
    const stint =
      await this.stintsService.findByIdWithRelationsOrThrow(stintId);
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

        // Get all stops for this stint
        const allStops = await stopRepo.find({
          where: { stint_id: stintId },
          order: { sequence_number: 'ASC' },
        });

        if (allStops.length === 0) {
          console.log(`No stops found for stint ${stintId}`);
          return;
        }

        console.log(`Found ${allStops.length} stops for stint ${stintId}`);

        // Create a map of stop_id to current stop
        const stopMap = new Map<number, Stop>();
        allStops.forEach((stop) => stopMap.set(stop.stop_id, stop));

        // validate that all stops in the request belong to this stint
        for (const item of stopOrder) {
          if (!stopMap.has(item.stop_id)) {
            throw new ForbiddenException(
              `Stop with ID ${item.stop_id} does not belong to stint ${stintId}`,
            );
          }
        }

        // Create a comprehensive reordering plan with all stops
        const reorderingPlan: {
          stop_id: number;
          sequence_number: number;
          stop: Stop;
        }[] = [];

        // Add the stops that were explicitly included in the request
        stopOrder.forEach((item) => {
          const stop = stopMap.get(item.stop_id);
          if (stop) {
            reorderingPlan.push({
              stop_id: item.stop_id,
              sequence_number: item.sequence_number,
              stop: stop,
            });
          }
        });

        // Add any stops that weren't included in the request (keeping their current sequence number)
        const stopIdsInRequest = new Set(stopOrder.map((item) => item.stop_id));
        allStops.forEach((stop) => {
          if (!stopIdsInRequest.has(stop.stop_id)) {
            reorderingPlan.push({
              stop_id: stop.stop_id,
              sequence_number: stop.sequence_number,
              stop: stop,
            });
          }
        });

        // Sort the complete reordering plan by the sequence number
        const sortedReorderingPlan = [...reorderingPlan].sort(
          (a, b) => a.sequence_number - b.sequence_number,
        );

        console.log(
          'Reordering plan:',
          JSON.stringify(
            sortedReorderingPlan.map((p) => ({
              stop_id: p.stop_id,
              old_seq: p.stop.sequence_number,
              new_seq: p.sequence_number,
            })),
          ),
        );

        // Now update all stops with their new sequence numbers
        const updatedStops: Stop[] = [];

        for (let i = 0; i < sortedReorderingPlan.length; i++) {
          const item = sortedReorderingPlan[i];
          const normalizedSequence = i + 1;

          if (item.stop.sequence_number !== normalizedSequence) {
            item.stop.sequence_number = normalizedSequence;
            await stopRepo.save(item.stop);
            console.log(
              `Updated stop ${item.stop_id} sequence to ${normalizedSequence}`,
            );
          }
          updatedStops.push(item.stop);
        }

        await this.updateLegsAfterStopChanges(stintId, updatedStops, manager);
        await this.updateStintStartEndLocations(stintId, manager);
        await this.recalculateStintTimeline(stintId, manager);
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

  async updateLegsAfterStopChanges(
    stintId: number,
    stopsChanged: Stop[] | undefined,
    manager: EntityManager,
  ): Promise<void> {
    if (!stopsChanged || stopsChanged.length === 0) {
      return;
    }

    console.log('update legs');

    const stint = await manager.getRepository(Stint).findOne({
      where: { stint_id: stintId },
      relations: ['start_location'],
    });

    if (!stint) {
      throw new NotFoundException(`Stint with ID ${stintId} not found`);
    }
    if (!stint.start_location_id) {
      throw new NotFoundException(
        `Stint with ID ${stintId} has no start location`,
      );
    }
    const startLocation = await this.locationsService.findById(
      stint.start_location_id,
      manager,
    );

    if (!startLocation) {
      throw new NotFoundException(
        `Start location for stint ${stintId} not found`,
      );
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
      console.log('removing existing legs');
      await legRepo.remove(existingLegs);
    }
    console.log('removed existing legs');
    // If there are no stops, don't create legs
    if (stops.length === 0) {
      return;
    }

    // Create leg between start location and first stop.
    const leg = legRepo.create({
      stint_id: stintId,
      start_location_id: startLocation.location_id,
      end_stop_id: stops[0].stop_id,
      sequence_number: 0,
      distance: 10, // This should be calculated based on API calls
      estimated_travel_time: 10, // This should be calculated based on API calls
    });
    console.log('saving first leg');
    console.log(leg);
    await legRepo.save(leg);

    // Create legs between consecutive stops
    for (let i = 0; i < stops.length - 1; i++) {
      const currentStop = stops[i];
      const nextStop = stops[i + 1];

      const leg = legRepo.create({
        stint_id: stintId,
        start_stop_id: currentStop.stop_id,
        end_stop_id: nextStop.stop_id,
        sequence_number: currentStop.sequence_number,
        distance: 10, // This should be calculated based on API calls
        estimated_travel_time: 10, // This should be calculated based on API calls
      });
      console.log('saving legs');
      console.log(leg);
      await legRepo.save(leg);
      console.log('legs saved');
    }
    console.log('all legs saved');
  }

  /**
   * Calculate and update total distance for a stint
   * This is not critical, so we can call this outside a transaction
   */
  async updateStintDistance(
    stintId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const totalDistance = await this.legsService.sumEstimatedTravelDistance(
      stintId,
      manager,
    );
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    // Update the stint with the new distance
    const stint = await this.stintsService.findById(stintId);
    stint.distance = totalDistance;
    await repo.save(stint);
  }

  /**
   * Calculate and update total duration for a stint
   * This is not critical, so we can call this outside a transaction
   */
  async updateStintDuration(
    stintId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = manager ? manager.getRepository(Stint) : this.stintRepository;
    const legDuration = await this.legsService.sumEstimatedTravelTime(
      stintId,
      manager,
    );
    const stopDuration = await this.stopsService.sumDuration(stintId, manager);
    // Update the stint with the new duration
    const stint = await this.stintsService.findById(stintId);
    stint.estimated_duration = legDuration + stopDuration;
    const lastStop = await this.stopsService.getStintEnd(stintId, manager);
    if (lastStop) {
      stint.end_time = lastStop.departure_time;
    }

    await repo.save(stint);
  }

  /**
   * Recalculate the timeline for a stint based on its stops and legs
   * This is called after adding/removing stops or legs
   * @param stint_id The ID of the stint to recalculate
   * @param manager Optional EntityManager for transaction
   * @returns Promise<void>
   */
  async recalculateStintTimeline(
    stint_id: number,
    manager?: EntityManager,
  ): Promise<void> {
    const stopRepo = manager
      ? manager.getRepository(Stop)
      : this.dataSource.getRepository(Stop);

    const legRepo = manager
      ? manager.getRepository(Leg)
      : this.dataSource.getRepository(Leg);
    console.log('start');

    const stint = await this.stintsService.findById(stint_id);
    if (!stint) {
      throw new NotFoundException(`Stint with ID ${stint_id} not found`);
    }
    const stops = await stopRepo.find({
      where: { stint_id: stint_id },
      order: { sequence_number: 'ASC' },
      relations: ['location'],
    });

    const legs = await legRepo.find({
      where: { stint_id: stint_id },
      order: { sequence_number: 'ASC' },
    });

    let currentTime = stint.start_time;
    const updatedStops: Stop[] = [];
    const updatedLegs: Leg[] = [];

    //handle first leg
    const firstLeg = legs[0];
    console.log(firstLeg);

    if (firstLeg) {
      currentTime = DateUtils.addMinutes(
        currentTime,
        firstLeg.estimated_travel_time,
      );
    }
    console.log('looping stops');
    for (const stop of stops) {
      stop.arrival_time = currentTime;

      stop.departure_time = DateUtils.addMinutes(
        stop.arrival_time,
        stop.duration,
      );
      updatedStops.push(stop);

      currentTime = stop.departure_time;

      const nextLeg = legs.find((leg) => leg.start_stop_id === stop.stop_id);
      if (nextLeg) {
        currentTime = DateUtils.addMinutes(
          currentTime,
          nextLeg.estimated_travel_time,
        );
        updatedLegs.push(nextLeg);
      }
    }

    if (stops.length > 0) {
      const lastStop = stops[stops.length - 1];
      stint.end_location = lastStop.location; //
    }
    console.log(updatedLegs);
    console.log(updatedStops);
    await stopRepo.save(updatedStops);
    await legRepo.save(updatedLegs);
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
    const stop = await this.stopsService.getStintEnd(stintId, manager);

    const stint = await manager.getRepository(Stint).findOne({
      where: { stint_id: stintId },
    });

    const updated = false;

    if (!stint) {
      throw new NotFoundException(
        `Stint with ID ${stintId} not found while updating stint locations.`,
      );
    }
    stint.end_location_id = stop.location_id;
    await manager.getRepository(Stint).save(stint);
  }

  formatDateToIso(date?: Date | null): string | null {
    if (!date) return null;

    if (typeof date === 'string') {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
      // If not a valid date string, return as is
      return date;
    }

    return date.toISOString();
  }
}
