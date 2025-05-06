import { Test, TestingModule } from '@nestjs/testing';
import { TripSuppliesController } from '../controllers/trip-supplies.controller';
import { TripSuppliesService } from '../services/trip-supplies.service';
import { CreateTripSupplyDto } from '../dto/create-trip-supply.dto';
import { UpdateTripSupplyDto } from '../dto/update-trip-supply.dto';
import { SupplyCategory } from '../../../common/enums';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { User } from '../../users/entities/user.entity';

describe('TripSuppliesController', () => {
  let controller: TripSuppliesController;
  let service: jest.Mocked<TripSuppliesService>;

  const mockUser: User = {
    user_id: 1,
    username: 'testuser',
    fullname: 'Test User',
    email: 'test@example.com',
    password_hash: 'hashedPassword',
    created_at: new Date(),
    updated_at: new Date(),
    created_trips: [],
    owned_vehicles: [],
    tripParticipants: [],
  };

  const mockSupply = {
    supply_id: 1,
    name: 'Tent',
    category: SupplyCategory.GEAR,
    created_at: new Date(),
    quantity: 2,
    notes: 'Bring two tents',
  };

  const mockCategorizedSupplies = {
    [SupplyCategory.GEAR]: [mockSupply],
    [SupplyCategory.FOOD]: [
      {
        supply_id: 2,
        name: 'Snacks',
        category: SupplyCategory.FOOD,
        created_at: new Date(),
        quantity: 10,
      },
    ],
  };

  beforeEach(async () => {
    const mockTripSuppliesService = {
      getTripSupplies: jest.fn(),
      getTripSuppliesByCategory: jest.fn(),
      addSupplyToTrip: jest.fn(),
      updateTripSupply: jest.fn(),
      removeTripSupply: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TripSuppliesController],
      providers: [
        {
          provide: TripSuppliesService,
          useValue: mockTripSuppliesService,
        },
      ],
    }).compile();

    controller = module.get<TripSuppliesController>(TripSuppliesController);
    service = module.get(TripSuppliesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getTripSupplies', () => {
    it('should return supplies for a trip', async () => {
      const supplies = [mockSupply];
      service.getTripSupplies.mockResolvedValue(supplies);

      const result = await controller.getTripSupplies(1);

      expect(service.getTripSupplies).toHaveBeenCalledWith(1);
      expect(result).toBe(supplies);
    });
  });

  describe('getTripSuppliesByCategory', () => {
    it('should return supplies grouped by category', async () => {
      service.getTripSuppliesByCategory.mockResolvedValue(
        mockCategorizedSupplies,
      );

      const result = await controller.getTripSuppliesByCategory(1);

      expect(service.getTripSuppliesByCategory).toHaveBeenCalledWith(1);
      expect(result).toBe(mockCategorizedSupplies);
    });
  });

  describe('addSupplyToTrip', () => {
    const createDto: CreateTripSupplyDto = {
      trip_id: 1,
      supply_id: 1,
      quantity: 2,
      notes: 'Bring two tents',
    };

    it('should add a supply to a trip', async () => {
      service.addSupplyToTrip.mockResolvedValue({
        tripId: 1,
        supplyId: 1,
        quantity: 2,
        notes: 'Bring two tents',
        supply: {
          supply_id: 1,
          name: 'Tent',
          category: SupplyCategory.GEAR,
        },
      } as any);

      const result = await controller.addSupplyToTrip(1, createDto, mockUser);

      expect(service.addSupplyToTrip).toHaveBeenCalledWith(
        { ...createDto, trip_id: 1 },
        mockUser.user_id,
      );
      expect(result.supplyId).toBe(1);
      expect(result.quantity).toBe(2);
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      service.addSupplyToTrip.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.addSupplyToTrip(1, createDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('updateTripSupply', () => {
    const updateDto: UpdateTripSupplyDto = {
      quantity: 3,
      notes: 'Updated notes',
    };

    it('should update a trip supply', async () => {
      service.updateTripSupply.mockResolvedValue({
        tripId: 1,
        supplyId: 1,
        quantity: 3,
        notes: 'Updated notes',
        supply: {
          supply_id: 1,
          name: 'Tent',
          category: SupplyCategory.GEAR,
        },
      } as any);

      const result = await controller.updateTripSupply(
        1,
        1,
        updateDto,
        mockUser,
      );

      expect(service.updateTripSupply).toHaveBeenCalledWith(
        1,
        1,
        updateDto,
        mockUser.user_id,
      );
      expect(result.quantity).toBe(3);
      expect(result.notes).toBe('Updated notes');
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      service.updateTripSupply.mockRejectedValue(new ForbiddenException());

      await expect(
        controller.updateTripSupply(1, 1, updateDto, mockUser),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when trip supply not found', async () => {
      service.updateTripSupply.mockRejectedValue(new NotFoundException());

      await expect(
        controller.updateTripSupply(1, 1, updateDto, mockUser),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeTripSupply', () => {
    it('should remove a trip supply', async () => {
      service.removeTripSupply.mockResolvedValue(undefined);

      await controller.removeTripSupply(1, 1, mockUser);

      expect(service.removeTripSupply).toHaveBeenCalledWith(
        1,
        1,
        mockUser.user_id,
      );
    });

    it('should throw ForbiddenException when user has no permission', async () => {
      service.removeTripSupply.mockRejectedValue(new ForbiddenException());

      await expect(controller.removeTripSupply(1, 1, mockUser)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when trip supply not found', async () => {
      service.removeTripSupply.mockRejectedValue(new NotFoundException());

      await expect(controller.removeTripSupply(1, 1, mockUser)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
