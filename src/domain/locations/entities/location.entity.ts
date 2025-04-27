import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Point } from 'geojson';
import { User } from '../../users/entities/user.entity';
import { Stop } from '../../itinerary/entities/stop.entity';
import { LocationCategoryCode } from '../../../common/enums';
import { LocationType } from './location-type.entity';
import { Leg } from '../../itinerary/entities/leg.entity';

@Entity('locations')
export class Location {
  @PrimaryGeneratedColumn()
  location_id: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  state: string;

  @Column({ nullable: true })
  postal_code: string;

  @Column({ nullable: true, default: 'USA' })
  country: string;

  // Standard coordinates for backward compatibility and ease of use
  @Column('float')
  latitude: number;

  @Column('float')
  longitude: number;

  // PostGIS geography type for spatial operations
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    nullable: true,
  })
  @Index({ spatial: true })
  geom: Point;

  // For external API integration
  @Column({ nullable: true })
  external_id: string;

  @Column({ nullable: true })
  external_source: string; // 'here', 'google', 'osm', 'user'

  @Column({ nullable: true })
  external_category_id: string;

  // Popularity metrics
  @Column({ default: 0 })
  usage_count: number;

  @Column({ default: 0 })
  user_rating: number;

  @Column({ default: 0 })
  rating_count: number;

  @Column({ default: false })
  is_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'created_by' })
  created_by: User;

  @Column({ nullable: true })
  created_by_id: number;

  // One-to-many relationship with stops
  @OneToMany(() => Stop, (stop) => stop.location)
  stops: Stop[];

  @OneToMany(() => Leg, (leg) => leg.start_location)
  legs: Leg[];

  /* @ManyToMany(() => LocationType, (category) => category.locations, {
    cascade: true,
  })
  @JoinTable({
    name: 'location_categories',
    joinColumn: { name: 'location_id', referencedColumnName: 'location_id' },
    inverseJoinColumn: { name: 'category_id', referencedColumnName: 'id' },
  })
  categories: LocationType[];*/

  // Helper method to create a GeoJSON Point
  static createPoint(latitude: number, longitude: number): Point {
    return {
      type: 'Point',
      coordinates: [longitude, latitude],
    };
  }
}
