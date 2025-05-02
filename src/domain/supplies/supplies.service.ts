import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { Supply } from './entities/supply.entity';
import { SupplyCategory } from '../../common/enums';
import { UpdateSupplyDto } from './dto/update-supply-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';

@Injectable()
export class SuppliesService extends BaseService<Supply> {
  constructor(
    @InjectRepository(Supply)
    repo: Repository<Supply>,
  ) {
    super(Supply, repo);
  }

  /**
   * Create a new supply
   * @param createSupplyDto The supply data to create
   * @returns The created supply
   */
  async create(
    createSupplyDto: CreateSupplyDto,
    manager?: EntityManager,
  ): Promise<Supply> {
    const repo = this.getRepo(manager);
    const supply = repo.create(createSupplyDto);
    return repo.save(supply);
  }

  /**
   * Find a supply by its ID
   * @param supply_id The supply ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The supply if found, or null if not found
   */
  async findOne(
    supply_id: number,
    manager?: EntityManager,
  ): Promise<Supply | null> {
    return this.findOneOrNull({ supply_id }, manager);
  }

  /**
   * Find all supplies
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of supplies
   */
  async findAllSupplies(manager?: EntityManager): Promise<Supply[]> {
    return this.findAll({}, manager);
  }

  /**
   * Find supplies by category
   * @param category The supply category
   * @param manager Optional EntityManager for transaction handling
   * @returns An array of supplies in the specified category
   */
  async findByCategory(
    category: SupplyCategory,
    manager?: EntityManager,
  ): Promise<Supply[]> {
    const repo = this.getRepo(manager);
    return repo.find({ where: { category } });
  }

  /**
   * Update a supply
   * @param id
   * @param updateSupplyDto
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated supply
   */
  async update(
    id: number,
    updateSupplyDto: UpdateSupplyDto,
    manager?: EntityManager,
  ): Promise<Supply> {
    const repo = this.getRepo(manager);
    const supply = await this.findOne(id);
    if (!supply) {
      throw new NotFoundException(`Supply with ID ${id} not found`);
    }

    Object.assign(supply, updateSupplyDto);
    return repo.save(supply);
  }

  /**
   * Remove a supply
   * @param id The supply ID
   */
  async remove(id: number, manager?: EntityManager): Promise<void> {
    const repo = this.getRepo(manager);
    const supply = await this.findOne(id);
    if (!supply) {
      throw new NotFoundException(`Supply with ID ${id} not found`);
    }

    await repo.remove(supply);
  }
}
