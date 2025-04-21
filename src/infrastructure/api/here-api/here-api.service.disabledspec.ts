/*
import { Test, TestingModule } from '@nestjs/testing';
import { HereApiService } from './here-api.service';
import { ConfigService } from '@nestjs/config';
import { StopsService } from '../../../domain/itinerary/services/stops.service';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HereApiService', () => {
  let service: HereApiService;
  let configService: jest.Mocked<ConfigService>;
  let stopsService: jest.Mocked<StopsService>;

  const mockStop = {
    stop_id: 1,
    latitude: 37.7749,
    longitude: -122.4194,
  };

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn(),
    };

    const mockStopsService = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HereApiService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: StopsService,
          useValue: mockStopsService,
        },
      ],
    }).compile();

    service = module.get<HereApiService>(HereApiService);
    configService = module.get(ConfigService);
    stopsService = module.get(StopsService);

    // Setup default mock for ConfigService
    configService.get.mockReturnValue('mock-api-key');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('geocodeLocations', () => {
    it('should successfully call HERE geocode API', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: 'San Francisco',
              position: { lat: 37.7749, lng: -122.4194 },
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.geocodeLocations('San Francisco', 5);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://discover.search.hereapi.com/v1/geocode',
        {
          params: {
            apiKey: 'mock-api-key',
            q: 'San Francisco',
            in: 'countryCode:USA',
            limit: 5,
          },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when query is empty', async () => {
      await expect(service.geocodeLocations('', 5)).rejects.toThrow(
        'Search query cannot be empty',
      );
    });

    it('should throw error when API key is not configured', async () => {
      configService.get.mockReturnValue('');

      await expect(service.geocodeLocations('test', 5)).rejects.toThrow(
        'HERE API key is not configured',
      );
    });

    it('should handle API errors appropriately', async () => {
      mockedAxios.get.mockRejectedValue({
        response: {
          status: 401,
          data: { error: 'Unauthorized' },
        },
      });

      await expect(service.geocodeLocations('test', 5)).rejects.toThrow(
        'HERE API Geocode search failed: 401 - {"error":"Unauthorized"}',
      );
    });
  });

  describe('discoverLocationsByStop', () => {
    it('should successfully call HERE discover API with stop coordinates', async () => {
      const mockResponse = {
        data: {
          items: [
            {
              title: 'Nearby Place',
              distance: 500,
            },
          ],
        },
      };

      stopsService.findOne.mockResolvedValue(mockStop as any);
      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.discoverLocationsByStop('coffee', 5, 1);

      expect(stopsService.findOne).toHaveBeenCalledWith(1);
      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://discover.search.hereapi.com/v1/discover',
        {
          params: {
            apiKey: 'mock-api-key',
            q: 'coffee',
            limit: 5,
            in: 'countryCode:USA',
            at: '37.7749,-122.4194',
          },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle stop not found error', async () => {
      stopsService.findOne.mockRejectedValue(new Error('Stop not found'));

      await expect(
        service.discoverLocationsByStop('coffee', 5, 999),
      ).rejects.toThrow('Stop not found');
    });
  });

  describe('getRoute', () => {
    it('should successfully call HERE routing API', async () => {
      const mockResponse = {
        data: {
          routes: [
            {
              sections: [
                {
                  summary: {
                    length: 1000,
                    duration: 120,
                  },
                },
              ],
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await service.getRoute(
        37.7749,
        -122.4194,
        37.3382,
        -121.8863,
      );

      expect(mockedAxios.get).toHaveBeenCalledWith(
        'https://router.hereapi.com/v8/routes',
        {
          params: {
            apiKey: 'mock-api-key',
            transportMode: 'car',
            origin: '37.7749,-122.4194',
            destination: '37.3382,-121.8863',
            return: 'polyline,summary,actions,instructions',
          },
        },
      );
      expect(result).toEqual(mockResponse.data);
    });
  });
});
*/
