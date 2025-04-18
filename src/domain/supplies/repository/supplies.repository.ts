import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Supply } from '../entities/supply.entity';
import { SupplyCategory } from '../../../common/enums';

@Injectable()
export class SuppliesRepository extends Repository<Supply> {
  constructor(private dataSource: DataSource) {
    super(Supply, dataSource.createEntityManager());
  }

  findById(supply_id: number): Promise<Supply | null> {
    return this.findOne({ where: { supply_id } });
  }

  findByCategory(category: SupplyCategory): Promise<Supply[]> {
    return this.find({ where: { category } });
  }
}
