import { Test, TestingModule } from '@nestjs/testing';
import { SuppliesService } from './supplies.service';
import { SuppliesRepository } from './repository/supplies.repository';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply-dto';
import { NotFoundException } from '@nestjs/common';
import { Supply } from './entities/supply.entity';
import { SupplyCategory } from '../../common/enums';

describe('SuppliesService', () => {
  let service: SuppliesService;
  let repository: jest.Mocked<SuppliesRepository>;

  const mockSupply: Supply = {
    supply_id: 1,
    name: '4 person tent',
    category: SupplyCategory.GEAR,
    created_at: new Date(),
  };

  beforeEach(async () => {
    const mockSuppliesRepository = {
      create: jest.fn(),
      save: jest.fn(),
      findById: jest.fn(),
      find: jest.fn(),
      findByCategory: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuppliesService,
        {
          provide: SuppliesRepository,
          useValue: mockSuppliesRepository,
        },
      ],
    }).compile();

    service = module.get<SuppliesService>(SuppliesService);
    repository = module.get(SuppliesRepository);
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
      expect(result).toBe(mockSupply);
    });
  });

  describe('findOne', () => {
    it('should return a supply when found', async () => {
      repository.findById.mockResolvedValue(mockSupply);

      const result = await service.findOne(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(result).toBe(mockSupply);
    });

    it('should throw NotFoundException when supply not found', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAll', () => {
    it('should return all supplies', async () => {
      const supplies = [mockSupply];
      repository.find.mockResolvedValue(supplies);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toBe(supplies);
    });
  });

  describe('findByCategory', () => {
    it('should return supplies by category', async () => {
      const supplies = [mockSupply];
      repository.findByCategory.mockResolvedValue(supplies);

      const result = await service.findByCategory(SupplyCategory.GEAR);

      expect(repository.findByCategory).toHaveBeenCalledWith(
        SupplyCategory.GEAR,
      );
      expect(result).toBe(supplies);
    });
  });

  describe('update', () => {
    const updateSupplyDto: UpdateSupplyDto = {
      name: '6 person tent',
      category: SupplyCategory.GEAR,
    };

    it('should update supply successfully', async () => {
      const updatedSupply = { ...mockSupply, ...updateSupplyDto };
      repository.findById.mockResolvedValue(mockSupply);
      repository.save.mockResolvedValue(updatedSupply);

      const result = await service.update(1, updateSupplyDto);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(updatedSupply);
    });

    it('should throw NotFoundException when supply not found for update', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.update(999, updateSupplyDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove supply successfully', async () => {
      repository.findById.mockResolvedValue(mockSupply);
      repository.remove.mockResolvedValue(mockSupply);

      await service.remove(1);

      expect(repository.findById).toHaveBeenCalledWith(1);
      expect(repository.remove).toHaveBeenCalledWith(mockSupply);
    });

    it('should throw NotFoundException when supply not found for removal', async () => {
      repository.findById.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
