import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, EntityManager, DeepPartial } from 'typeorm';
import { Point } from 'geojson';
import { Location } from './entities/location.entity';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { LocationCategoryCode } from '../../common/enums';
import { BaseService } from '../../common/services/base.service';
import { HereApiService } from '../../infrastructure/api/here-api/here-api.service';
import { GeocodeLocationDto } from './dto/geocode-location.dto';
import { DiscoverNearbyDto } from './dto/discover-nearby.dto';
import { StopsService } from '../itinerary/services/stops.service';

@Injectable()
export class LocationsService extends BaseService<Location> {
  constructor(
    @InjectRepository(Location)
    repo: Repository<Location>,
    @Inject(forwardRef(() => HereApiService))
    private readonly hereApiService: HereApiService,
    @Inject(forwardRef(() => StopsService))
    private readonly stopsService: StopsService,
  ) {
    super(Location, repo);
  }

  /**
   * Create a new location
   * @param createLocationDto The location data
   * @param userId Optional ID of the creating user
   * @param manager Optional EntityManager for transaction handling
   * @returns The created location
   */
  async createLocation(
    createLocationDto: CreateLocationDto,
    userId?: number,
    manager?: EntityManager,
  ): Promise<Location> {
    // Create GeoJSON Point from latitude/longitude
    const geom: Point = Location.createPoint(
      createLocationDto.latitude,
      createLocationDto.longitude,
    );

    const finalData: DeepPartial<Location> = {
      ...createLocationDto,
      geom,
      created_by_id: userId,
    };

    return this.create(finalData, manager);
  }
  /**
   * Geocode an address and create a location
   * @param addressQuery The address to geocode
   * @param locationName Optional name for the location
   * @param locationDescription Optional description for the location
   * @param userId Optional ID of the creating user
   * @param manager Optional EntityManager for transaction handling
   * @returns Object containing the created location and the HERE API response
   */
  /**
   * Geocode an address and create a location
   * @param geocodeDto The geocode request data
   * @param userId Optional ID of the creating user
   * @param manager Optional EntityManager for transaction handling
   * @returns Object containing the created location and the HERE API response
   */
  async geocodeAndCreateLocation(
    geocodeDto: GeocodeLocationDto,
    userId?: number,
    manager?: EntityManager,
  ): Promise<{ location: Location; hereResponse: any }> {
    try {
      // Call HERE API to geocode the address
      const geocodeResult = await this.hereApiService.geocodeLocations(
        geocodeDto.address,
        1,
      );

      if (!geocodeResult.items || geocodeResult.items.length === 0) {
        throw new NotFoundException(
          `No locations found for address: ${geocodeDto.address}`,
        );
      }

      // Get the first (best) result
      const bestMatch = geocodeResult.items[0];

      if (
        !bestMatch.position ||
        !bestMatch.position.lat ||
        !bestMatch.position.lng
      ) {
        throw new BadRequestException('Geocoding result missing position data');
      }

      // Create location from HERE API data
      const locationData: CreateLocationDto = {
        name: geocodeDto.name || bestMatch.title,
        description: geocodeDto.description,
        address: bestMatch.address?.label || geocodeDto.address,
        city: bestMatch.address?.city,
        state: bestMatch.address?.state,
        postal_code: bestMatch.address?.postalCode,
        country: bestMatch.address?.countryName || 'USA',
        latitude: bestMatch.position.lat,
        longitude: bestMatch.position.lng,
        external_id: bestMatch.id,
        external_source: 'here',
      };

      // Create the location
      const location = await this.createLocation(locationData, userId, manager);

      return {
        location,
        hereResponse: bestMatch,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(`Error geocoding address: ${error.message}`);
    }
  }

  /**
   * Discover nearby locations using either a stop or location as the center point
   * @param discoverDto The discover request data
   * @param stopsService Optional StopsService for fetching stop data when stopId is provided
   * @returns Array of nearby locations with HERE API details
   */
  async discoverNearby(
    discoverDto: DiscoverNearbyDto,
  ): Promise<{ locations: any[]; hereResponse: any }> {
    try {
      let latitude: number;
      let longitude: number;

      // Get coordinates based on either stopId or locationId
      if (discoverDto.stopId) {
        const stop = await this.stopsService.findById(discoverDto.stopId);
        latitude = stop.latitude;
        longitude = stop.longitude;
      } else if (discoverDto.locationId) {
        // Get location coordinates directly
        const location = await this.findById(discoverDto.locationId);
        latitude = location.latitude;
        longitude = location.longitude;
      } else {
        throw new BadRequestException(
          'Either stopId or locationId must be provided',
        );
      }

      if (!discoverDto.limit) {
        discoverDto.limit = 10;
      }

      // Call HERE API to discover nearby locations
      const discoverResult =
        await this.hereApiService.discoverLocationsByCoordinates(
          discoverDto.query,
          discoverDto.limit,
          latitude,
          longitude,
        );

      if (!discoverResult.items || discoverResult.items.length === 0) {
        return { locations: [], hereResponse: discoverResult };
      }

      // Transform HERE API results to a format similar to our Location entity
      const locations = discoverResult.items.map((item: any) => {
        return {
          name: item.title,
          description: item.resultType,
          address: item.address?.label,
          city: item.address?.city,
          state: item.address?.state,
          postal_code: item.address?.postalCode,
          country: item.address?.countryName || 'USA',
          latitude: item.position?.lat,
          longitude: item.position?.lng,
          external_id: item.id,
          external_source: 'here',
          distance: item.distance, // Distance in meters from the search center
          categories: item.categories,
          // Include the complete HERE item for additional info
          hereDetails: item,
        };
      });

      return {
        locations,
        hereResponse: discoverResult,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new Error(`Error discovering nearby locations: ${error.message}`);
    }
  }

  /**
   * Find a location by ID
   * @param id The location ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The location or throws an error if not found
   */
  async findById(id: number, manager?: EntityManager): Promise<Location> {
    return this.findOneOrThrow({ location_id: id }, manager);
  }

  /**
   * Fina a location by coordinates
   * @param lat Latitude of the location
   * @param long Longitude of the location
   * @param manager Optional EntityManager for transaction handling
   * @returns The location or null if not found
   */
  async findByCoordinates(
    lat: number,
    long: number,
    manager?: EntityManager,
  ): Promise<Location | null> {
    return this.findOneOrNull({ latitude: lat, longitude: long }, manager);
  }

  /**
   * Find locations near a point
   * @param latitude Latitude of the center point
   * @param longitude Longitude of the center point
   * @param locationId Optional location ID to use as the center point
   * @param radiusInMeters Radius to search within (in meters)
   * @param limit Maximum number of results to return
   * @param manager Optional EntityManager for transaction handling
   * @returns Array of nearby locations with distance
   */
  async findNearby(
    latitude?: number,
    longitude?: number,
    locationId?: number,
    radiusInMeters: number = 5000,
    limit: number = 10,
    manager?: EntityManager,
  ): Promise<{ location: Location; distance: number }[]> {
    const repo = this.getRepo(manager);

    // If locationId is provided, use that to get coordinates
    if (locationId) {
      const location = await this.findById(locationId, manager);
      if (!location) {
        throw new NotFoundException(`Location with ID ${locationId} not found`);
      }
      latitude = location.latitude;
      longitude = location.longitude;
    }

    // Validate we have coordinates to search with
    if (!latitude || !longitude) {
      throw new BadRequestException(
        'Either lat/lng or locationId must be provided',
      );
    }

    const point = `POINT(${longitude} ${latitude})`;

    const query = repo
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
    const repo = this.getRepo(manager);

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
    const repo = this.getRepo(manager);

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

    const repo = this.getRepo(manager);
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
    const repo = this.getRepo(manager);
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
    await this.delete({ location_id: id }, manager);
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
