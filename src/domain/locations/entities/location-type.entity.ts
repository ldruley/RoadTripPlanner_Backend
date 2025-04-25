import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Location } from './location.entity';

@Entity()
export class LocationType {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // e.g. 'restaurant', 'national-park'

  @Column()
  name: string;

  @Column()
  here_id: string;

  @ManyToMany(() => Location, (location) => location.categories)
  locations: Location[];

  // If we want hierarchical categories, we can add a parent-child relationship
  @ManyToOne(() => LocationType, (category) => category.children, {
    nullable: true,
  })
  parent: LocationType;

  @OneToMany(() => LocationType, (category) => category.parent)
  children: LocationType[];
}
