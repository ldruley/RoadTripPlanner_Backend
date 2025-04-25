import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DataSource } from 'typeorm';
import { Point } from 'geojson';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationCategoryCode } from '../../common/enums';
import { LocationType } from './entities/location-type.entity';
import { Trip } from '../trips/entities/trip.entity';

@Injectable()
export class LocationsService {
  constructor(
    @InjectRepository(Location)
    private locationRepository: Repository<Location>,
    private dataSource: DataSource,
  ) {}

  /**
   * Create a new location
   * @param createLocationDto The location data
   * @param userId Optional ID of the creating user
   * @param manager Optional EntityManager for transaction handling
   * @returns The created location
   */
  async create(
    createLocationDto: CreateLocationDto,
    userId?: number,
    manager?: EntityManager,
  ): Promise<Location> {
    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;

    // Create GeoJSON Point from latitude/longitude

    const geom: Point = Location.createPoint(
      createLocationDto.latitude,
      createLocationDto.longitude,
    );

    const location = repo.create({
      ...createLocationDto,
      geom,
      created_by_id: userId,
    });

    return repo.save(location);
  }

  /**
   * Find a location by ID
   * @param id The location ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The location or throws an error if not found
   */
  async findById(id: number, manager?: EntityManager): Promise<Location> {
    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;
    const location = await repo.findOne({ where: { location_id: id } });

    if (!location) {
      throw new NotFoundException(`Location with ID ${id} not found`);
    }

    return location;
  }

  async findByCoordinates(
    lat: number,
    long: number,
    manager?: EntityManager,
  ): Promise<Location | null> {
    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;
    const location = await repo.findOne({
      where: {
        latitude: lat,
        longitude: long,
      },
    });

    return location;
  }

  /**
   * Find locations near a point
   * @param latitude Latitude of the center point
   * @param longitude Longitude of the center point
   * @param radiusInMeters Radius to search within (in meters)
   * @param limit Maximum number of results to return
   * @param locationType Optional type filter
   * @param manager Optional EntityManager for transaction handling
   * @returns Array of nearby locations with distance
   */
  async findNearby(
    latitude: number,
    longitude: number,
    radiusInMeters: number = 5000,
    limit: number = 10,
    locationType?: LocationCategoryCode,
    manager?: EntityManager,
  ): Promise<{ location: Location; distance: number }[]> {
    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;
    const point = `POINT(${longitude} ${latitude})`;

    let query = repo
      .createQueryBuilder('location')
      .select([
        'location.*',
        `ST_Distance(
          location.geom::geography, 
          ST_SetSRID(ST_GeomFromText(:point), 4326)::geography
        ) as distance`,
      ])
      .where(
        `ST_DWithin(
        location.geom::geography, 
        ST_SetSRID(ST_GeomFromText(:point), 4326)::geography, 
        :radius
      )`,
      )
      .setParameters({
        point: point,
        radius: radiusInMeters,
      })
      .orderBy('distance', 'ASC')
      .limit(limit);

    if (locationType) {
      query = query.andWhere('location.location_type = :locationType', {
        locationType,
      });
    }

    const results = await query.getRawMany();

    return results.map((result) => ({
      location: {
        location_id: result.location_id,
        name: result.name,
        description: result.description,
        address: result.address,
        city: result.city,
        state: result.state,
        postal_code: result.postal_code,
        country: result.country,
        latitude: result.latitude,
        longitude: result.longitude,
        geom: result.geom,
        location_type: result.location_type,
        external_id: result.external_id,
        external_source: result.external_source,
        usage_count: result.usage_count,
        user_rating: result.user_rating,
        rating_count: result.rating_count,
        is_verified: result.is_verified,
        created_at: result.created_at,
        updated_at: result.updated_at,
        created_by_id: result.created_by_id,
      } as Location,
      distance: parseFloat(result.distance),
    }));
  }

  /**
   * Find locations along a route
   * @param polyline Encoded polyline of the route
   * @param bufferInMeters Buffer distance around the route in meters
   * @param limit Maximum number of results to return
   * @param locationType Optional type filter
   * @param manager Optional EntityManager for transaction handling
   * @returns Array of locations along the route
   */
  /* async findAlongRoute(
    polyline: string,
    bufferInMeters: number = 1000,
    limit: number = 20,
    locationType?: LocationType,
    manager?: EntityManager,
  ): Promise<Location[]> {
    // This is a placeholder for now - we'll implement polyline decoding later
    // Future implementation will decode the polyline to a LineString
    // and use ST_DWithin to find locations near the route

    // For now, return an empty array
    return [];
  }*/

  /**
   * Search for locations by name or address
   * @param term Search term
   * @param limit Maximum number of results to return
   * @param manager Optional EntityManager for transaction handling
   * @returns Array of matching locations
   */
  async search(
    term: string,
    limit: number = 10,
    manager?: EntityManager,
  ): Promise<Location[]> {
    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;

    return repo
      .createQueryBuilder('location')
      .where('location.name ILIKE :term', { term: `%${term}%` })
      .orWhere('location.address ILIKE :term', { term: `%${term}%` })
      .orWhere('location.city ILIKE :term', { term: `%${term}%` })
      .orderBy('location.usage_count', 'DESC')
      .limit(limit)
      .getMany();
  }

  /**
   * Get or create a location from external API data
   * @param externalId External API ID
   * @param source Source of the external data (e.g., 'here')
   * @param data Data from the external API
   * @param userId Optional ID of the creating user
   * @param manager Optional EntityManager for transaction handling
   * @returns The existing or newly created location
   */
  /* async getOrCreateFromExternal(
    externalId: string,
    source: string,
    data: any,
    userId?: number,
    manager?: EntityManager,
  ): Promise<Location> {
    // Use transaction if no manager provided
    if (!manager) {
      return this.dataSource.transaction(async (transactionManager) => {
        return this.getOrCreateFromExternal(
          externalId,
          source,
          data,
          userId,
          transactionManager,
        );
      });
    }

    const repo = manager.getRepository(Location);

    // Check if location already exists
    const existingLocation = await repo.findOne({
      where: {
        external_id: externalId,
        external_source: source,
      },
    });

    if (existingLocation) {
      return existingLocation;
    }

    // Create new location from external data
    // Implementation will depend on the structure of the external API data
    // This is a simplified example assuming HERE API format
    const createLocationDto: CreateLocationDto = {
      name: data.title,
      address: data.address?.label,
      city: data.address?.city,
      state: data.address?.state,
      postal_code: data.address?.postalCode,
      country: data.address?.countryCode || 'USA',
      latitude: data.position.lat,
      longitude: data.position.lng,
      location_type: this.mapExternalCategoriesToLocationType(
        data.categories,
        source,
      ),
      external_id: externalId,
      external_source: source,
      description: data.description || null,
    };

    return this.create(createLocationDto, userId, manager);
  }*/

  /**
   * Increment the usage count for a location
   * @param locationId The location ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated location
   */
  async incrementUsageCount(
    locationId: number,
    manager?: EntityManager,
  ): Promise<Location> {
    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;

    await repo
      .createQueryBuilder()
      .update(Location)
      .set({
        usage_count: () => 'usage_count + 1',
      })
      .where('location_id = :locationId', { locationId })
      .execute();

    return this.findById(locationId, manager);
  }

  /**
   * Add a rating for a location
   * @param locationId The location ID
   * @param rating Rating value (1-5)
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated location
   */
  async addRating(
    locationId: number,
    rating: number,
    manager?: EntityManager,
  ): Promise<Location> {
    // Ensure rating is between 1 and 5
    rating = Math.min(Math.max(rating, 1), 5);

    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;
    const location = await this.findById(locationId, manager);

    // Calculate new average rating
    const newRatingCount = location.rating_count + 1;
    const totalRating = location.user_rating * location.rating_count + rating;
    const newRating = totalRating / newRatingCount;

    location.user_rating = newRating;
    location.rating_count = newRatingCount;

    return repo.save(location);
  }

  /**
   * Update a location
   * @param id The location ID
   * @param updateLocationDto The updated location data
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated location
   */
  async update(
    id: number,
    updateLocationDto: UpdateLocationDto,
    manager?: EntityManager,
  ): Promise<Location> {
    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;
    const location = await this.findById(id, manager);

    // Update geom if latitude or longitude changed
    if (
      (updateLocationDto.latitude !== undefined &&
        updateLocationDto.latitude !== location.latitude) ||
      (updateLocationDto.longitude !== undefined &&
        updateLocationDto.longitude !== location.longitude)
    ) {
      const lat = updateLocationDto.latitude ?? location.latitude;
      const lng = updateLocationDto.longitude ?? location.longitude;
      updateLocationDto.geom = Location.createPoint(lat, lng);
    }

    Object.assign(location, updateLocationDto);

    return repo.save(location);
  }

  /**
   * Delete a location
   * @param id The location ID
   * @param manager Optional EntityManager for transaction handling
   * @returns void
   */
  async remove(id: number, manager?: EntityManager): Promise<void> {
    const repo = manager
      ? manager.getRepository(Location)
      : this.locationRepository;
    const location = await this.findById(id, manager);

    await repo.remove(location);
  }

  /**
   * Map categories from external APIs to our location types
   * @param categories Categories from external API
   * @param source Source of the external data
   * @returns Mapped LocationType
   */
  /*private mapExternalCategoriesToLocationType(
    categories: any[],
    source: string,
  ): LocationType {
    if (!categories || categories.length === 0) {
      return LocationType.OTHER;
    }

    // Implementation will depend on the structure of the categories
    // This is a simplified example assuming HERE API format
    if (source === 'here') {
      const category = categories[0].id.toLowerCase();

      if (category.includes('hotel') || category.includes('accommodation')) {
        return LocationType.LODGING;
      }
      if (category.includes('restaurant') || category.includes('food')) {
        return LocationType.RESTAURANT;
      }
      if (category.includes('petrol-station') || category.includes('gas')) {
        return LocationType.GAS_STATION;
      }
      // Add more mappings as needed
    }

    return LocationType.OTHER;
  }*/
}
