import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StopsService } from '../../../domain/itinerary/services/stops.service';
import axios from 'axios';
import { Stop } from '../../../domain/itinerary/entities/stop.entity';

@Injectable()
export class HereApiService {
  private readonly apiKey: string;
  private readonly discoverBaseUrl: string =
    'https://discover.search.hereapi.com/v1';
  private readonly routingBaseUrl: string = 'https://router.hereapi.com/v8';

  constructor(
    private configService: ConfigService,
    @Inject(forwardRef(() => StopsService))
    private stopsService: StopsService,
  ) {
    this.apiKey = this.configService.get<string>('app.hereApiKey') || '';
  }

  async geocodeLocations(query: string, limit: number) {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query cannot be empty');
      }

      if (!this.apiKey || this.apiKey === '') {
        throw new Error('HERE API key is not configured');
      }

      console.log(
        'Making HERE Geocode API request with key:',
        this.apiKey.substring(0, 3) + '...',
      );
      console.log('Query:', query);

      const response = await axios.get(`${this.discoverBaseUrl}/geocode`, {
        params: {
          apiKey: this.apiKey,
          q: query,
          in: 'countryCode:USA',
          limit: limit,
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        throw new Error(
          `HERE API Geocode search failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        // The request was made but no response was received
        throw new Error(`HERE API Geocode search failed: No response received`);
      } else {
        // Something happened in setting up the request that triggered an Error
        throw new Error(`HERE API Geocode search failed: ${error.message}`);
      }
    }
  }

  async discoverLocationsByStop(
    query: string,
    limit: number,
    prevStopId: number,
  ) {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query cannot be empty');
      }

      if (!this.apiKey || this.apiKey === '') {
        throw new Error('HERE API key is not configured');
      }

      // Get previous stop coordinates
      const prevStop = await this.stopsService.findById(prevStopId);

      const params = {
        apiKey: this.apiKey,
        q: query,
        limit: limit,
        in: 'countryCode:USA',
        at: `${prevStop.latitude},${prevStop.longitude}`,
      };

      console.log(
        'Making HERE Discover API request with key:',
        this.apiKey.substring(0, 3) + '...',
      );
      console.log('Query:', query);

      const response = await axios.get(`${this.discoverBaseUrl}/discover`, {
        params,
      });
      return response.data;
    } catch (error) {
      // Error handling
      if (error.response) {
        throw new Error(
          `HERE API search failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        throw new Error(`HERE API search failed: No response received`);
      } else {
        throw new Error(`HERE API search failed: ${error.message}`);
      }
    }
  }

  async discoverLocationsByCoordinates(
    query: string,
    limit: number,
    lat: number,
    lng: number,
  ) {
    try {
      if (!query || query.trim() === '') {
        throw new Error('Search query cannot be empty');
      }

      if (!this.apiKey || this.apiKey === '') {
        throw new Error('HERE API key is not configured');
      }

      const params = {
        apiKey: this.apiKey,
        q: query,
        limit: limit,
        in: 'countryCode:USA',
        at: `${lat},${lng}`,
      };

      console.log(
        'Making HERE Discover API request with key:',
        this.apiKey.substring(0, 3) + '...',
      );
      console.log('Query:', query);

      const response = await axios.get(`${this.discoverBaseUrl}/discover`, {
        params,
      });
      return response.data;
    } catch (error) {
      // Error handling
      if (error.response) {
        throw new Error(
          `HERE API search failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        throw new Error(`HERE API search failed: No response received`);
      } else {
        throw new Error(`HERE API search failed: ${error.message}`);
      }
    }
  }

  async searchPOI(
    category: string,
    lat: number,
    lng: number,
    radius: number = 5000,
    limit: number = 10,
  ) {
    try {
      const response = await axios.get(`${this.discoverBaseUrl}/browse`, {
        params: {
          apiKey: this.apiKey,
          at: `${lat},${lng}`,
          categories: category,
          limit,
          radius,
        },
      });
      return response.data;
    } catch (error) {
      throw new Error(`HERE API POI search failed: ${error.message}`);
    }
  }

  async getRoute(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ) {
    try {
      const response = await axios.get(`${this.routingBaseUrl}/routes`, {
        params: {
          apiKey: this.apiKey,
          transportMode: 'car',
          origin: `${startLat},${startLng}`,
          destination: `${endLat},${endLng}`,
          return: 'polyline,summary,actions,instructions',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `HERE Routing API failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        throw new Error(`HERE Routing API failed: No response received`);
      } else {
        throw new Error(`HERE Routing API failed: ${error.message}`);
      }
    }
  }

  /**
   * Get a route with multiple waypoints for a complete stint
   * @param startLat Starting latitude
   * @param startLng Starting longitude
   * @param waypoints Array of waypoints with latitude and longitude coordinates
   * @param endLat Ending latitude
   * @param endLng Ending longitude
   * @returns Route information from HERE API
   */
  async getRouteWithWaypoints(
    startLat: number,
    startLng: number,
    waypoints: { lat: number; lng: number }[],
    endLat: number,
    endLng: number,
  ) {
    try {
      if (!this.apiKey || this.apiKey === '') {
        throw new Error('HERE API key is not configured');
      }

      // Format waypoints as "lat,lng" strings
      const waypointStrings = waypoints.map((wp) => `${wp.lat},${wp.lng}`);

      // Build the via parameter (waypoints)
      const viaParams = waypointStrings
        .map((wp) => `&via=${encodeURIComponent(wp)}`)
        .join('');
      console.log(viaParams);
      // Build the full URL with all parameters
      const url = `${this.routingBaseUrl}/routes`;

      const response: any = await axios.get(url, {
        params: {
          apiKey: this.apiKey,
          transportMode: 'car',
          origin: `${startLat},${startLng}`,
          destination: `${endLat},${endLng}`,
          return: 'polyline,summary,actions,instructions',
        },
        // We need to handle the via parameters separately because axios would encode them incorrectly
        paramsSerializer: (params) => {
          const serialized = Object.entries(params)
            .map(
              ([key, value]) => `${key}=${encodeURIComponent(String(value))}`,
            )
            .join('&');

          return serialized + viaParams;
        },
      });

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `HERE Routing API failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        throw new Error(`HERE Routing API failed: No response received`);
      } else {
        throw new Error(`HERE Routing API failed: ${error.message}`);
      }
    }
  }

  /**
   * Calculate a route with multiple stops, their durations, and a specific departure time
   * @param points Array of points with latitude, longitude, and optional duration in minutes
   * @param departureTime Optional departure time as ISO string or Date, defaults to now
   * @returns Route data from HERE API with sections between each pair of points
   */
  async calculateRouteWithWaypoints(
    points: { lat: number; lng: number; duration?: number }[],
    departureTime?: Date | string,
  ): Promise<any> {
    try {
      if (!this.apiKey || this.apiKey === '') {
        throw new Error('HERE API key is not configured');
      }

      if (points.length < 2) {
        throw new Error(
          'At least two points (origin and destination) are required',
        );
      }

      // Format origin
      const origin = `${points[0].lat},${points[0].lng}`;

      // Set departure time
      let initialDepartureTime: Date;
      if (departureTime) {
        initialDepartureTime =
          departureTime instanceof Date
            ? departureTime
            : new Date(departureTime);
      } else {
        initialDepartureTime = new Date();
      }

      // Format the initial departure time as ISO string
      const initialDepartureTimeStr = initialDepartureTime.toISOString();

      // Build the via parameters with departure times based on durations
      const viaParams: string[] = [];
      for (let i = 1; i < points.length - 1; i++) {
        const point = points[i];
        viaParams.push(
          `&via=${encodeURIComponent(`${point.lat},${point.lng}`)}`,
        );

        // If this point has a duration, add only the waypointDuration parameter
        if (point.duration && point.duration > 0) {
          const durationInSeconds = Math.round(point.duration * 60);
          viaParams.push(`&waypointDuration=${durationInSeconds}`);
        }
      }

      // Format destination
      const destination = `${points[points.length - 1].lat},${points[points.length - 1].lng}`;

      // Base parameters
      const baseParams = {
        apiKey: this.apiKey,
        transportMode: 'car',
        origin: origin,
        destination: destination,
        departureTime: initialDepartureTimeStr,
        return: 'polyline,summary,actions,instructions,travelSummary',
        spans: 'names,length,duration,baseDuration',
        routingMode: 'fast',
      };

      // Convert base params to URL query string
      const baseParamsString = Object.entries(baseParams)
        .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
        .join('&');

      // Combine base params and via params
      const fullParamsString = baseParamsString + viaParams.join('');

      console.log(
        `Making HERE Routing API request with ${points.length} points (${points.length - 2} waypoints)`,
      );
      console.log(`Departure time: ${initialDepartureTimeStr}`);

      // Make the request
      const response = await axios.get(
        `${this.routingBaseUrl}/routes?${fullParamsString}`,
      );

      return response.data;
    } catch (error) {
      if (error.response) {
        throw new Error(
          `HERE Routing API failed: ${error.response.status} - ${JSON.stringify(error.response.data)}`,
        );
      } else if (error.request) {
        throw new Error(`HERE Routing API failed: No response received`);
      } else {
        throw new Error(`HERE Routing API failed: ${error.message}`);
      }
    }
  }
}
