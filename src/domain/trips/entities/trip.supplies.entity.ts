import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { Trip } from './trip.entity';
import { Supply } from '../../supplies/entities/supply.entity';

@Entity('trip_supplies')
export class TripSupply {
  @PrimaryColumn()
  tripId: number;

  @PrimaryColumn()
  supplyId: number;

  @ManyToOne(() => Trip, (trip) => trip.supplies, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tripId' })
  trip: Trip;

  @ManyToOne(() => Supply, (supply) => supply.tripSupplies, { nullable: false })
  @JoinColumn({ name: 'supplyId' })
  supply: Supply;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;
}
