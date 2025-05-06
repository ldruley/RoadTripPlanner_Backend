import { Test, TestingModule } from '@nestjs/testing';
import { SuppliesService } from './supplies.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Supply } from './entities/supply.entity';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply-dto';
import { NotFoundException } from '@nestjs/common';
import { SupplyCategory } from '../../common/enums';
import { Repository } from 'typeorm';

describe('SuppliesService', () => {
  let service: SuppliesService;
  let repository: jest.Mocked<Repository<Supply>>;

  const mockSupply: Supply = {
    supply_id: 1,
    name: '4 person tent',
    category: SupplyCategory.GEAR,
    created_at: new Date(),
    tripSupplies: [],
  };

  beforeEach(async () => {
    const mockRepository = {
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliesService,
        {
          provide: getRepositoryToken(Supply),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<SuppliesService>(SuppliesService);
    repository = module.get(getRepositoryToken(Supply));

    // Mock BaseService methods that are used in SuppliesService
    (service as any).findAll = jest.fn();
    (service as any).findOneOrNull = jest.fn();
    (service as any).findOneOrThrow = jest.fn();
    (service as any).getRepo = jest.fn().mockReturnValue(repository);
    (service as any).exists = jest.fn();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createSupplyDto: CreateSupplyDto = {
      name: '4 person tent',
      category: SupplyCategory.GEAR,
    };

    it('should create a supply successfully', async () => {
      repository.create.mockReturnValue(mockSupply);
      repository.save.mockResolvedValue(mockSupply);

      const result = await service.create(createSupplyDto);

      expect(repository.create).toHaveBeenCalledWith(createSupplyDto);
      expect(repository.save).toHaveBeenCalledWith(mockSupply);
      expect(result).toEqual(mockSupply);
    });
  });

  describe('findOne', () => {
    it('should return a supply when found', async () => {
      (service as any).findOneOrNull.mockResolvedValue(mockSupply);

      const result = await service.findOne(1);

      expect((service as any).findOneOrNull).toHaveBeenCalledWith(
        { supply_id: 1 },
        undefined,
      );
      expect(result).toEqual(mockSupply);
    });

    it('should return null when supply not found', async () => {
      (service as any).findOneOrNull.mockResolvedValue(null);

      const result = await service.findOne(999);

      expect(result).toBeNull();
    });
  });

  describe('findAllSupplies', () => {
    it('should return all supplies', async () => {
      const supplies = [mockSupply];
      (service as any).findAll.mockResolvedValue(supplies);

      const result = await service.findAllSupplies();

      expect((service as any).findAll).toHaveBeenCalledWith({}, undefined);
      expect(result).toEqual(supplies);
    });
  });

  describe('findByCategory', () => {
    it('should return supplies by category', async () => {
      const supplies = [mockSupply];
      repository.find.mockResolvedValue(supplies);

      const result = await service.findByCategory(SupplyCategory.GEAR);

      expect(repository.find).toHaveBeenCalledWith({
        where: { category: SupplyCategory.GEAR },
      });
      expect(result).toEqual(supplies);
    });
  });

  describe('update', () => {
    const updateSupplyDto: UpdateSupplyDto = {
      name: '6 person tent',
      category: SupplyCategory.GEAR,
    };

    it('should update supply successfully', async () => {
      const updatedSupply = { ...mockSupply, ...updateSupplyDto };
      (service as any).findOne = jest.fn().mockResolvedValue(mockSupply);
      repository.save.mockResolvedValue(updatedSupply);

      const result = await service.update(1, updateSupplyDto);

      expect((service as any).findOne).toHaveBeenCalledWith(1);
      expect(repository.save).toHaveBeenCalledWith({
        ...mockSupply,
        ...updateSupplyDto,
      });
      expect(result).toEqual(updatedSupply);
    });

    it('should throw NotFoundException when supply not found', async () => {
      (service as any).findOne = jest.fn().mockResolvedValue(null);

      await expect(service.update(999, updateSupplyDto)).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should remove supply successfully', async () => {
      (service as any).findOne = jest.fn().mockResolvedValue(mockSupply);
      repository.remove.mockResolvedValue(mockSupply);

      await service.remove(1);

      expect((service as any).findOne).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(mockSupply);
    });

    it('should throw NotFoundException when supply not found', async () => {
      (service as any).findOne = jest.fn().mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
