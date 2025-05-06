import { Test, TestingModule } from '@nestjs/testing';
import { TripSuppliesService } from '../services/trip-supplies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TripSupply } from '../entities/trip.supplies.entity';
import { Repository } from 'typeorm';
import { TripsService } from '../services/trips.service';
import { SuppliesService } from '../../supplies/supplies.service';
import { CreateTripSupplyDto } from '../dto/create-trip-supply.dto';
import { UpdateTripSupplyDto } from '../dto/update-trip-supply.dto';
import {
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { SupplyCategory } from '../../../common/enums';

describe('TripSuppliesService', () => {
  let service: TripSuppliesService;
  let repository: jest.Mocked<Repository<TripSupply>>;
  let tripsService: jest.Mocked<TripsService>;
  let suppliesService: jest.Mocked<SuppliesService>;

  const mockRepository = () => ({
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    delete: jest.fn(),
  });

  const mockTrip = {
    trip_id: 1,
    title: 'Test Trip',
    creator_id: 1,
  };

  const mockSupply = {
    supply_id: 1,
    name: 'Tent',
    category: SupplyCategory.GEAR,
    created_at: new Date(),
  };

  const mockTripSupply = {
    tripId: 1,
    supplyId: 1,
    quantity: 2,
    notes: 'Bring two tents',
    supply: mockSupply,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripSuppliesService,
        {
          provide: getRepositoryToken(TripSupply),
          useFactory: mockRepository,
        },
        {
          provide: TripsService,
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: SuppliesService,
          useValue: {
            create: jest.fn(),
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<TripSuppliesService>(TripSuppliesService);
    repository = module.get(getRepositoryToken(TripSupply));
    tripsService = module.get(TripsService);
    suppliesService = module.get(SuppliesService);

    // Setup BaseService methods used in the service
    (service as any).findOneOrNull = jest.fn();
    (service as any).findOneOrThrow = jest.fn();
    (service as any).save = jest.fn();
    (service as any).delete = jest.fn();
    (service as any).getRepo = jest.fn().mockReturnValue(repository);
    (service as any).withTransaction = jest.fn().mockImplementation((fn) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return fn(undefined); // Just call the function directly for testing
    });
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTripSupplies', () => {
    it('should return supplies for a trip', async () => {
      repository.find.mockResolvedValue([mockTripSupply as any]);

      const result = await service.getTripSupplies(1);

      expect(repository.find).toHaveBeenCalledWith({
        where: { tripId: 1 },
        relations: ['supply'],
      });

      expect(result).toEqual([
        {
          supply_id: 1,
          name: 'Tent',
          category: SupplyCategory.GEAR,
          created_at: expect.any(Date),
          quantity: 2,
          notes: 'Bring two tents',
        },
      ]);
    });

    it('should return empty array when no supplies found', async () => {
      repository.find.mockResolvedValue([]);

      const result = await service.getTripSupplies(1);

      expect(result).toEqual([]);
    });
  });

  describe('getTripSuppliesByCategory', () => {
    it('should group supplies by category', async () => {
      const mockSupplies = [
        {
          supply_id: 1,
          name: 'Tent',
          category: SupplyCategory.GEAR,
          created_at: new Date(),
          quantity: 2,
          notes: 'Bring two tents',
        },
        {
          supply_id: 2,
          name: 'Sleeping bag',
          category: SupplyCategory.GEAR,
          created_at: new Date(),
          quantity: 4,
        },
        {
          supply_id: 3,
          name: 'Snacks',
          category: SupplyCategory.FOOD,
          created_at: new Date(),
          quantity: 10,
        },
      ];

      // Mock the getTripSupplies method
      jest.spyOn(service, 'getTripSupplies').mockResolvedValue(mockSupplies);

      const result = await service.getTripSuppliesByCategory(1);

      expect(service.getTripSupplies).toHaveBeenCalledWith(1, undefined);
      expect(result).toEqual({
        [SupplyCategory.GEAR]: [mockSupplies[0], mockSupplies[1]],
        [SupplyCategory.FOOD]: [mockSupplies[2]],
      });
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
      tripsService.findOne.mockResolvedValue(mockTrip as any);
      (service as any).findOneOrNull.mockResolvedValue(null); // Supply not already added
      repository.create.mockReturnValue(mockTripSupply as any);
      (service as any).save.mockResolvedValue(mockTripSupply as any);

      const result = await service.addSupplyToTrip(createDto, 1);

      expect(tripsService.findOne).toHaveBeenCalledWith(1, expect.anything());
      expect((service as any).findOneOrNull).toHaveBeenCalledWith(
        { tripId: 1, supplyId: 1 },
        expect.anything(),
      );
      expect(repository.create).toHaveBeenCalledWith({
        tripId: 1,
        supplyId: 1,
        quantity: 2,
        notes: 'Bring two tents',
      });
      expect((service as any).save).toHaveBeenCalled();
      expect(result).toEqual(mockTripSupply);
    });

    it('should update quantity if supply already exists', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip as any);
      (service as any).findOneOrNull.mockResolvedValue(mockTripSupply); // Supply already added
      (service as any).save.mockResolvedValue({
        ...mockTripSupply,
        quantity: 4,
      });

      const result = await service.addSupplyToTrip(createDto, 1);

      expect((service as any).save).toHaveBeenCalledWith({
        ...mockTripSupply,
        quantity: 4, // 2 (existing) + 2 (new)
        notes: 'Bring two tents',
      });
      expect(result.quantity).toBe(4);
    });

    it('should create a new supply if supply_id is not provided but new_supply is', async () => {
      const createWithNewSupplyDto: CreateTripSupplyDto = {
        trip_id: 1,
        quantity: 1,
        new_supply: {
          name: 'New Tent',
          category: SupplyCategory.GEAR,
        },
      };

      tripsService.findOne.mockResolvedValue(mockTrip as any);
      suppliesService.create.mockResolvedValue({
        ...mockSupply,
        supply_id: 2,
        name: 'New Tent',
        tripSupplies: [],
      });
      (service as any).findOneOrNull.mockResolvedValue(null);
      repository.create.mockReturnValue({
        tripId: 1,
        supplyId: 2,
        quantity: 1,
      } as any);
      (service as any).save.mockResolvedValue({
        tripId: 1,
        supplyId: 2,
        quantity: 1,
        supply: { ...mockSupply, supply_id: 2, name: 'New Tent' },
      } as any);

      const result = await service.addSupplyToTrip(createWithNewSupplyDto, 1);

      expect(suppliesService.create).toHaveBeenCalledWith(
        createWithNewSupplyDto.new_supply,
        expect.anything(),
      );
      expect(repository.create).toHaveBeenCalledWith({
        tripId: 1,
        supplyId: 2,
        quantity: 1,
      });
      expect(result.supplyId).toBe(2);
    });

    it('should throw ConflictException if neither supply_id nor new_supply is provided', async () => {
      const invalidDto: CreateTripSupplyDto = {
        trip_id: 1,
        quantity: 2,
      };

      await expect(service.addSupplyToTrip(invalidDto, 1)).rejects.toThrow(
        ConflictException,
      );
    });

    it('should throw ForbiddenException when user is not the trip creator', async () => {
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as any);

      await expect(service.addSupplyToTrip(createDto, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('updateTripSupply', () => {
    const updateDto: UpdateTripSupplyDto = {
      quantity: 3,
      notes: 'Updated notes',
    };

    it('should update a trip supply', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip as any);
      (service as any).findOneOrThrow.mockResolvedValue(mockTripSupply);
      (service as any).save.mockResolvedValue({
        ...mockTripSupply,
        ...updateDto,
      });

      const result = await service.updateTripSupply(1, 1, updateDto, 1);

      expect(tripsService.findOne).toHaveBeenCalledWith(1, expect.anything());
      expect((service as any).findOneOrThrow).toHaveBeenCalledWith(
        { tripId: 1, supplyId: 1 },
        expect.anything(),
      );
      expect((service as any).save).toHaveBeenCalledWith({
        ...mockTripSupply,
        quantity: 3,
        notes: 'Updated notes',
      });
      expect(result.quantity).toBe(3);
      expect(result.notes).toBe('Updated notes');
    });

    it('should throw ForbiddenException when user is not the trip creator', async () => {
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as any);

      await expect(
        service.updateTripSupply(1, 1, updateDto, 1),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when trip supply not found', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip as any);
      (service as any).findOneOrThrow.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(
        service.updateTripSupply(1, 1, updateDto, 1),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('removeTripSupply', () => {
    it('should remove a trip supply', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip as any);
      (service as any).findOneOrThrow.mockResolvedValue(mockTripSupply);
      (service as any).delete.mockResolvedValue({ affected: 1 });

      await service.removeTripSupply(1, 1, 1);

      expect(tripsService.findOne).toHaveBeenCalledWith(1, expect.anything());
      expect((service as any).findOneOrThrow).toHaveBeenCalledWith(
        { tripId: 1, supplyId: 1 },
        expect.anything(),
      );
      expect((service as any).delete).toHaveBeenCalledWith(
        { tripId: 1, supplyId: 1 },
        expect.anything(),
      );
    });

    it('should throw ForbiddenException when user is not the trip creator', async () => {
      tripsService.findOne.mockResolvedValue({
        ...mockTrip,
        creator_id: 999,
      } as any);

      await expect(service.removeTripSupply(1, 1, 1)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException when trip supply not found', async () => {
      tripsService.findOne.mockResolvedValue(mockTrip as any);
      (service as any).findOneOrThrow.mockRejectedValue(
        new NotFoundException(),
      );

      await expect(service.removeTripSupply(1, 1, 1)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
