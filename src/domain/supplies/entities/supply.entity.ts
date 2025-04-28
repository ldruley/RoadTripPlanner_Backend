import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import { SupplyCategory } from '../../../common/enums';
import { TripSupply } from '../../trips/entities/trip.supplies.entity';

@Entity('supplies')
export class Supply {
  @PrimaryGeneratedColumn()
  supply_id: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: SupplyCategory,
    default: SupplyCategory.OTHER,
  })
  category: SupplyCategory;

  @CreateDateColumn()
  created_at: Date;

  @OneToMany(() => TripSupply, (tripSupply) => tripSupply.supply)
  tripSupplies: TripSupply[];
}
