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
export class LocationCategory {
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
  @ManyToOne(() => LocationCategory, (category) => category.children, {
    nullable: true,
  })
  parent: LocationCategory;

  @OneToMany(() => LocationCategory, (category) => category.parent)
  children: LocationCategory[];
}
