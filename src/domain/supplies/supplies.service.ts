import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { Supply } from './entities/supply.entity';
import { SupplyCategory } from '../../common/enums';
import { UpdateSupplyDto } from './dto/update-supply-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SuppliesService {
  constructor(
    @InjectRepository(Supply)
    private supplyRepository: Repository<Supply>,
  ) {}

  /**
   * Create a new supply
   * @param createSupplyDto The supply data to create
   * @returns The created supply
   */
  async create(createSupplyDto: CreateSupplyDto): Promise<Supply> {
    const supply = this.supplyRepository.create(createSupplyDto);
    return this.supplyRepository.save(supply);
  }

  /**
   * Find a supply by its ID
   * @param supply_id The supply ID
   * @returns The supply if found, or null if not found
   */
  async findOne(supply_id: number): Promise<Supply | null> {
    const supply = await this.supplyRepository.findOne({
      where: { supply_id },
    });
    if (!supply) {
      throw new NotFoundException(`Supply with ID ${supply_id} not found`);
    }

    return supply;
  }

  /**
   * Find all supplies
   * @returns An array of supplies
   */
  async findAll(): Promise<Supply[]> {
    return this.supplyRepository.find();
  }

  /**
   * Find supplies by category
   * @param category The supply category
   * @returns An array of supplies in the specified category
   */
  async findByCategory(category: SupplyCategory): Promise<Supply[]> {
    return this.supplyRepository.find({ where: { category } });
  }

  /**
   * Update a supply
   * @param id
   * @param updateSupplyDto
   * @returns The updated supply
   */
  async update(id: number, updateSupplyDto: UpdateSupplyDto): Promise<Supply> {
    const supply = await this.findOne(id);
    if (!supply) {
      throw new NotFoundException(`Supply with ID ${id} not found`);
    }

    Object.assign(supply, updateSupplyDto);
    return this.supplyRepository.save(supply);
  }

  /**
   * Remove a supply
   * @param id The supply ID
   */
  async remove(id: number): Promise<void> {
    const supply = await this.findOne(id);
    if (!supply) {
      throw new NotFoundException(`Supply with ID ${id} not found`);
    }

    await this.supplyRepository.remove(supply);
  }
}
