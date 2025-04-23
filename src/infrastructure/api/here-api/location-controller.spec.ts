import { Test, TestingModule } from '@nestjs/testing';
import { LocationController } from './location-controller';
import { HereApiService } from './here-api.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LocationController', () => {
  let controller: LocationController;
  let service: jest.Mocked<HereApiService>;

  const mockLocationData = {
    items: [
      {
        title: 'San Francisco',
        position: { lat: 37.7749, lng: -122.4194 },
      },
    ],
  };

  beforeEach(async () => {
    const mockHereApiService = {
      geocodeLocations: jest.fn(),
      discoverLocationsByStop: jest.fn(),
      discoverLocationsByCoordinates: jest.fn(),
      searchPOI: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LocationController],
      providers: [
        {
          provide: HereApiService,
          useValue: mockHereApiService,
        },
      ],
    }).compile();

    controller = module.get<LocationController>(LocationController);
    service = module.get(HereApiService) as jest.Mocked<HereApiService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('geocodeLocations', () => {
    it('should return matching locations', async () => {
      service.geocodeLocations.mockResolvedValue(mockLocationData);

      const result = await controller.geocodeLocations('San Francisco', 5);

      expect(service.geocodeLocations).toHaveBeenCalledWith('San Francisco', 5);
      expect(result).toBe(mockLocationData);
    });

    it('should handle service errors', async () => {
      service.geocodeLocations.mockRejectedValue(new Error('API error'));

      await expect(controller.geocodeLocations('test', 5)).rejects.toThrow(
        'API error',
      );
    });
  });

  describe('discoverLocationsByStop', () => {
    it('should return locations near a previous stop', async () => {
      service.discoverLocationsByStop.mockResolvedValue(mockLocationData);

      const result = await controller.discoverLocationsByStop('coffee', 5, 1);

      expect(service.discoverLocationsByStop).toHaveBeenCalledWith(
        'coffee',
        5,
        1,
      );
      expect(result).toBe(mockLocationData);
    });

    it('should handle stop not found error', async () => {
      service.discoverLocationsByStop.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        controller.discoverLocationsByStop('coffee', 5, 999),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('discoverLocationsByCoordinates', () => {
    it('should return locations near specified coordinates', async () => {
      service.discoverLocationsByCoordinates.mockResolvedValue(
        mockLocationData,
      );

      const result = await controller.discoverLocationsByCoordinates(
        'coffee',
        5,
        '37.7749',
        '-122.4194',
      );

      expect(service.discoverLocationsByCoordinates).toHaveBeenCalledWith(
        'coffee',
        5,
        37.7749,
        -122.4194,
      );
      expect(result).toBe(mockLocationData);
    });

    it('should throw BadRequestException for invalid coordinates', async () => {
      await expect(
        controller.discoverLocationsByCoordinates(
          'coffee',
          5,
          'invalid',
          '-122.4194',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('searchPOI', () => {
    it('should return nearby POIs', async () => {
      const mockPOIData = {
        items: [
          {
            title: 'Coffee Shop',
            distance: 500,
          },
        ],
      };
      service.searchPOI.mockResolvedValue(mockPOIData);

      const result = await controller.searchPOI(
        'coffee',
        37.7749,
        -122.4194,
        5000,
        10,
      );

      expect(service.searchPOI).toHaveBeenCalledWith(
        'coffee',
        37.7749,
        -122.4194,
        5000,
        10,
      );
      expect(result).toBe(mockPOIData);
    });
  });
});
