import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripSupply } from '../entities/trip.supplies.entity';
import { EntityManager, Repository } from 'typeorm';
import { TripsService } from './trips.service';
import { SuppliesService } from '../../supplies/supplies.service';
import { BaseService } from '../../../common/services/base.service';
import { CreateTripSupplyDto } from '../dto/create-trip-supply.dto';
import { UpdateTripSupplyDto } from '../dto/update-trip-supply.dto';
import { SupplyWithQuantity } from '../../interfaces/supplies/supply.interface';

@Injectable()
export class TripSuppliesService extends BaseService<TripSupply> {
  constructor(
    @InjectRepository(TripSupply)
    repo: Repository<TripSupply>,
    private readonly tripsService: TripsService,
    private readonly suppliesService: SuppliesService,
  ) {
    super(TripSupply, repo);
  }

  /**
   * Get all supplies for a trip
   * @param tripId The ID of the trip
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of TripSupply entities with supply details
   */
  async getTripSupplies(
    tripId: number,
    manager?: EntityManager,
  ): Promise<SupplyWithQuantity[]> {
    const repo = this.getRepo(manager);
    const tripSupplies = await repo.find({
      where: { tripId },
      relations: ['supply'],
    });

    if (!tripSupplies || tripSupplies.length === 0) {
      return [];
    }

    // Transform to SupplyWithQuantity format
    return tripSupplies.map((tripSupply) => ({
      supply_id: tripSupply.supply.supply_id,
      name: tripSupply.supply.name,
      category: tripSupply.supply.category,
      created_at: tripSupply.supply.created_at,
      quantity: tripSupply.quantity,
      notes: tripSupply.notes ?? undefined,
    }));
  }

  /**
   * Get supplies for a trip, grouped by category
   * @param tripId The ID of the trip
   * @param manager Optional EntityManager for transaction handling
   * @returns An object with category keys and arrays of supplies
   */
  async getTripSuppliesByCategory(
    tripId: number,
    manager?: EntityManager,
  ): Promise<Record<string, SupplyWithQuantity[]>> {
    const supplies = await this.getTripSupplies(tripId, manager);

    // Group supplies by category
    return supplies.reduce(
      (acc, supply) => {
        const category = supply.category;

        if (!acc[category]) {
          acc[category] = [];
        }

        acc[category].push(supply);

        return acc;
      },
      {} as Record<string, SupplyWithQuantity[]>,
    );
  }

  /**
   * Add a supply to a trip
   * @param dto The CreateTripSupplyDto with trip and supply details
   * @param userId The ID of the user making the request
   * @returns The created TripSupply entity with supply details
   */
  async addSupplyToTrip(
    dto: CreateTripSupplyDto,
    userId: number,
  ): Promise<TripSupply> {
    // Check if either supply_id or new_supply is provided
    if (!dto.supply_id && !dto.new_supply) {
      throw new ConflictException(
        'Either supply_id or new_supply must be provided',
      );
    }

    return this.withTransaction(async (manager) => {
      // Check if trip exists and user has permission
      const trip = await this.tripsService.findOne(dto.trip_id, manager);
      if (trip.creator_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to add supplies to this trip',
        );
      }

      let supplyId = dto.supply_id;

      // If no existing supply ID but new supply details provided, create the supply
      if (!supplyId && dto.new_supply) {
        const newSupply = await this.suppliesService.create(
          dto.new_supply,
          manager,
        );
        supplyId = newSupply.supply_id;
      }

      if (!supplyId) {
        throw new BadRequestException('Supply ID is required');
      }

      // Check if the supply is already added to this trip
      const existingTripSupply = await this.findOneOrNull(
        { tripId: dto.trip_id, supplyId },
        manager,
      );

      if (existingTripSupply) {
        // Update quantity instead of creating new record
        existingTripSupply.quantity += dto.quantity;
        if (dto.notes) {
          existingTripSupply.notes = dto.notes;
        }
        return await this.save(existingTripSupply, manager);
      }

      // Create a new trip supply record
      const repo = this.getRepo(manager);
      const tripSupply = repo.create({
        tripId: dto.trip_id,
        supplyId,
        quantity: dto.quantity,
        notes: dto.notes,
      });

      return await this.save(tripSupply, manager);
    });
  }

  /**
   * Update a supply in a trip
   * @param tripId The ID of the trip
   * @param supplyId The ID of the supply
   * @param dto The UpdateTripSupplyDto with updated details
   * @param userId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated TripSupply entity
   */
  async updateTripSupply(
    tripId: number,
    supplyId: number,
    dto: UpdateTripSupplyDto,
    userId: number,
    manager?: EntityManager,
  ): Promise<TripSupply> {
    return this.withTransaction(async (transactionManager) => {
      const tm = manager || transactionManager;

      // Check if trip exists and user has permission
      const trip = await this.tripsService.findOne(tripId, tm);
      if (trip.creator_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to update supplies for this trip',
        );
      }

      // Find the trip supply
      const tripSupply = await this.findOneOrThrow({ tripId, supplyId }, tm);

      // Update fields
      if (dto.quantity !== undefined) {
        tripSupply.quantity = dto.quantity;
      }

      if (dto.notes !== undefined) {
        tripSupply.notes = dto.notes;
      }

      return this.save(tripSupply, tm);
    });
  }

  /**
   * Find a trip supply by trip ID and supply ID
   * @param tripId The trip ID
   * @param supplyId The supply ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The TripSupply if found, or throws NotFoundException
   */
  async findOneOrThrow(
    criteria: { tripId: number; supplyId: number },
    manager?: EntityManager,
  ): Promise<TripSupply> {
    const repo = this.getRepo(manager);
    const tripSupply = await repo.findOne({
      where: criteria,
      relations: ['supply'],
    });

    if (!tripSupply) {
      throw new NotFoundException('Trip supply not found');
    }

    return tripSupply;
  }

  /**
   * Find a trip supply by trip ID and supply ID
   * @param tripId The trip ID
   * @param supplyId The supply ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The TripSupply if found, or null if not found
   */
  async findOneOrNull(
    criteria: { tripId: number; supplyId: number },
    manager?: EntityManager,
  ): Promise<TripSupply | null> {
    const repo = this.getRepo(manager);
    return repo.findOne({
      where: criteria,
      relations: ['supply'],
    });
  }

  /**
   * Remove a supply from a trip
   * @param tripId The ID of the trip
   * @param supplyId The ID of the supply
   * @param userId The ID of the user making the request
   * @param manager Optional EntityManager for transaction handling
   */
  async removeTripSupply(
    tripId: number,
    supplyId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<void> {
    return this.withTransaction(async (transactionManager) => {
      const tm = manager || transactionManager;

      // Check if trip exists and user has permission
      const trip = await this.tripsService.findOne(tripId, tm);
      if (trip.creator_id !== userId) {
        throw new ForbiddenException(
          'You do not have permission to remove supplies from this trip',
        );
      }

      // Find the trip supply
      const tripSupply = await this.findOneOrThrow({ tripId, supplyId }, tm);

      // Remove the trip supply
      await this.delete({ tripId, supplyId }, tm);
    });
  }
}
