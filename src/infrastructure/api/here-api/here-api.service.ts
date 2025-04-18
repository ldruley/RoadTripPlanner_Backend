import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StopsService } from '../../../domain/Itinerary/services/stops.service';
import axios from 'axios';
import { Stop } from '../../../domain/Itinerary/entities/stop.entity';

@Injectable()
export class HereApiService {
  private readonly apiKey: string;
  private readonly discoverBaseUrl: string =
    'https://discover.search.hereapi.com/v1';
  private readonly routingBaseUrl: string = 'https://router.hereapi.com/v8';

  constructor(
    private configService: ConfigService,
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
      const prevStop = await this.stopsService.findOne(prevStopId);

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
}
