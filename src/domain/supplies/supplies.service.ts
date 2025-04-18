import { Injectable, NotFoundException } from '@nestjs/common';
import { SuppliesRepository } from './repository/supplies.repository';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { Supply } from './entities/supply.entity';
import { SupplyCategory } from '../../common/enums';
import { UpdateSupplyDto } from './dto/update-supply-dto';

@Injectable()
export class SuppliesService {
  constructor(private suppliesRepository: SuppliesRepository) {}

  async create(createSupplyDto: CreateSupplyDto): Promise<Supply> {
    const supply = this.suppliesRepository.create(createSupplyDto);
    return this.suppliesRepository.save(supply);
  }

  async findOne(id: number): Promise<Supply | null> {
    const supply = await this.suppliesRepository.findById(id);
    if (!supply) {
      throw new NotFoundException(`Supply with ID ${id} not found`);
    }
    return supply;
  }

  async findAll(): Promise<Supply[]> {
    return this.suppliesRepository.find();
  }

  async findByCategory(category: SupplyCategory): Promise<Supply[]> {
    return this.suppliesRepository.findByCategory(category);
  }

  async update(id: number, updateSupplyDto: UpdateSupplyDto): Promise<Supply> {
    const supply = await this.findOne(id);
    if (!supply) {
      throw new NotFoundException(`Supply with ID ${id} not found`);
    }

    Object.assign(supply, updateSupplyDto);
    return this.suppliesRepository.save(supply);
  }

  async remove(id: number): Promise<void> {
    const supply = await this.findOne(id);
    if (!supply) {
      throw new NotFoundException(`Supply with ID ${id} not found`);
    }

    await this.suppliesRepository.remove(supply);
  }
}
