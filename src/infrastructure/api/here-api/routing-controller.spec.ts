import { Test, TestingModule } from '@nestjs/testing';
import { RoutingController } from './routing-controller';
import { HereApiService } from './here-api.service';

describe('RoutingController', () => {
  let controller: RoutingController;
  let service: jest.Mocked<HereApiService>;

  const mockRouteData = {
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
  };

  beforeEach(async () => {
    const mockHereApiService = {
      getRoute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [RoutingController],
      providers: [
        {
          provide: HereApiService,
          useValue: mockHereApiService,
        },
      ],
    }).compile();

    controller = module.get<RoutingController>(RoutingController);
    service = module.get(HereApiService) as jest.Mocked<HereApiService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getRoute', () => {
    it('should return route information', async () => {
      service.getRoute.mockResolvedValue(mockRouteData);

      const result = await controller.getRoute(
        37.7749,
        -122.4194,
        37.3382,
        -121.8863,
      );

      expect(service.getRoute).toHaveBeenCalledWith(
        37.7749,
        -122.4194,
        37.3382,
        -121.8863,
      );
      expect(result).toBe(mockRouteData);
    });

    it('should handle service errors', async () => {
      service.getRoute.mockRejectedValue(new Error('Routing API failed'));

      await expect(
        controller.getRoute(37.7749, -122.4194, 37.3382, -121.8863),
      ).rejects.toThrow('Routing API failed');
    });
  });
});
