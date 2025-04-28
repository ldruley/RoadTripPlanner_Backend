import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TripSupply } from '../entities/trip.supplies.entity';
import { EntityManager, Repository } from 'typeorm';
import { TripsService } from './trips.service';
import { SuppliesService } from '../../supplies/supplies.service';
import { BaseService } from '../../../common/services/base.service';

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
   * @returns An array of TripSupply entities
   */
  async getTripSupplies(
    tripId: number,
    manager?: EntityManager,
  ): Promise<TripSupply[]> {
    const repo = this.getRepo(manager);
    return await repo.find({
      where: { tripId },
      relations: ['supply'],
    });
  }

  /**
   * Add a supply to a trip
   * @param tripId The ID of the trip
   * @param supplyId The ID of the supply
   * @param quantity The quantity of the supply
   * @param notes Optional notes for the supply
   * @param manager Optional EntityManager for transaction handling
   * @returns The created TripSupply entity
   */
  async addTripSupply(
    tripId: number,
    supplyId: number,
    quantity: number = 1,
    notes?: string | null,
    manager?: EntityManager,
  ): Promise<TripSupply> {
    const repo = this.getRepo(manager);

    // Check if the trip exists
    await this.tripsService.findOne(tripId, manager);

    //if(! (await this.suppliesService.findOne(supplyId, manager)) {
    //  this.suppliesService.create()
    // }

    const tripSupply = repo.create({
      tripId,
      supplyId,
      quantity,
      notes,
    });

    return await repo.save(tripSupply);
  }

  /**
   * Remove a supply from a trip
   * @param tripId The ID of the trip
   * @param supplyId The ID of the supply
   * @param manager Optional EntityManager for transaction handling
   */
  async removeTripSupply(
    tripId: number,
    supplyId: number,
    manager?: EntityManager,
  ): Promise<void> {
    const repo = this.getRepo(manager);

    const tripSupply = await this.findOneOrThrow({ tripId, supplyId }, manager);

    // Check if the supply exists
    if (!tripSupply) {
      throw new NotFoundException(`Trip supply with ID ${tripId} not found`);
    }
    await repo.remove(tripSupply);
  }
}
