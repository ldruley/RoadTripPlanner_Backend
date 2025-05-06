import { Test, TestingModule } from '@nestjs/testing';
import { SuppliesController } from './supplies.controller';
import { SuppliesService } from './supplies.service';
import { CreateSupplyDto } from './dto/create-supply.dto';
import { UpdateSupplyDto } from './dto/update-supply-dto';
import { SupplyCategory } from '../../common/enums';
import { Supply } from './entities/supply.entity';
import { NotFoundException } from '@nestjs/common';

describe('SuppliesController', () => {
  let controller: SuppliesController;
  let service: jest.Mocked<SuppliesService>;

  const mockSupply: Supply = {
    supply_id: 1,
    name: '4 person tent',
    category: SupplyCategory.GEAR,
    created_at: new Date(),
    tripSupplies: [],
  };

  beforeEach(async () => {
    const mockSuppliesService = {
      create: jest.fn(),
      findAllSupplies: jest.fn(),
      findOne: jest.fn(),
      findByCategory: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [SuppliesController],
      providers: [
        {
          provide: SuppliesService,
          useValue: mockSuppliesService,
        },
      ],
    }).compile();

    controller = module.get<SuppliesController>(SuppliesController);
    service = module.get(SuppliesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    const createSupplyDto: CreateSupplyDto = {
      name: '4 person tent',
      category: SupplyCategory.GEAR,
    };

    it('should create a new supply successfully', async () => {
      service.create.mockResolvedValue(mockSupply);

      const result = await controller.create(createSupplyDto);

      expect(service.create).toHaveBeenCalledWith(createSupplyDto);
      expect(result).toEqual(mockSupply);
    });
  });

  describe('findAll', () => {
    it('should return all supplies', async () => {
      const supplies = [mockSupply];
      service.findAllSupplies.mockResolvedValue(supplies);

      const result = await controller.findAll();

      expect(service.findAllSupplies).toHaveBeenCalled();
      expect(result).toEqual(supplies);
    });
  });

  describe('findOne', () => {
    it('should return a supply by ID', async () => {
      service.findOne.mockResolvedValue(mockSupply);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockSupply);
    });

    it('should throw NotFoundException when supply not found', async () => {
      service.findOne.mockRejectedValue(new NotFoundException());

      await expect(controller.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCategory', () => {
    it('should return supplies by category', async () => {
      const supplies = [mockSupply];
      service.findByCategory.mockResolvedValue(supplies);

      const result = await controller.findByCategory(SupplyCategory.GEAR);

      expect(service.findByCategory).toHaveBeenCalledWith(SupplyCategory.GEAR);
      expect(result).toEqual(supplies);
    });
  });

  describe('update', () => {
    const updateSupplyDto: UpdateSupplyDto = {
      name: '6 person tent',
      category: SupplyCategory.GEAR,
    };

    it('should update a supply successfully', async () => {
      const updatedSupply = { ...mockSupply, ...updateSupplyDto };
      service.update.mockResolvedValue(updatedSupply);

      const result = await controller.update(1, updateSupplyDto);

      expect(service.update).toHaveBeenCalledWith(1, updateSupplyDto);
      expect(result).toEqual(updatedSupply);
    });

    it('should throw NotFoundException when supply not found', async () => {
      service.update.mockRejectedValue(new NotFoundException());

      await expect(controller.update(999, updateSupplyDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove a supply successfully', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException when supply not found', async () => {
      service.remove.mockRejectedValue(new NotFoundException());

      await expect(controller.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
