import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
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

  /*  @ManyToMany(() => Location, (location) => location.categories)
  locations: Location[];*/
}
