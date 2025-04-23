import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user-dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

describe('UsersController', () => {
  let controller: UsersController;
  let service: jest.Mocked<UsersService>;

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
  };

  beforeEach(async () => {
    const mockUsersService = {
      create: jest.fn(),
      findAll: jest.fn(),
      findOne: jest.fn(),
      findByUsername: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get(UsersService) as jest.Mocked<UsersService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const createUserDto: CreateUserDto = {
        username: 'newuser',
        fullname: 'New User',
        email: 'new@example.com',
        password: 'password123',
      };

      service.create.mockResolvedValue(mockUser);

      const result = await controller.create(createUserDto);

      expect(service.create).toHaveBeenCalledWith(createUserDto);
      expect(result).toBe(mockUser);
    });
  });

  describe('findUsers', () => {
    it('should return all users when no filters provided', async () => {
      const users = [mockUser];
      service.findAll.mockResolvedValue(users);

      const result = await controller.findUsers();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toBe(users);
    });

    it('should filter by username when provided', async () => {
      service.findByUsername.mockResolvedValue(mockUser);

      const result = await controller.findUsers('testuser');

      expect(service.findByUsername).toHaveBeenCalledWith('testuser');
      expect(result).toBe(mockUser);
    });

    it('should filter by email when provided', async () => {
      service.findByEmail.mockResolvedValue(mockUser);

      const result = await controller.findUsers(undefined, 'test@example.com');

      expect(service.findByEmail).toHaveBeenCalledWith('test@example.com');
      expect(result).toBe(mockUser);
    });
  });

  describe('findOne', () => {
    it('should return a single user', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne(1);

      expect(service.findOne).toHaveBeenCalledWith(1);
      expect(result).toBe(mockUser);
    });
  });

  describe('findByAuthenticatedUser', () => {
    it('should return the authenticated user', async () => {
      service.findOne.mockResolvedValue(mockUser);

      const result = await controller.findByAuthenticatedUser(mockUser);

      expect(service.findOne).toHaveBeenCalledWith(mockUser.user_id);
      expect(result).toBe(mockUser);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updateUserDto: Partial<UpdateUserDto> = {
        username: 'updateduser',
      };
      const updatedUser = { ...mockUser, ...updateUserDto };
      service.update.mockResolvedValue(updatedUser);

      const result = await controller.update(1, updateUserDto);

      expect(service.update).toHaveBeenCalledWith(1, updateUserDto);
      expect(result).toBe(updatedUser);
    });
  });

  describe('remove', () => {
    it('should remove a user', async () => {
      service.remove.mockResolvedValue(undefined);

      await controller.remove(1);

      expect(service.remove).toHaveBeenCalledWith(1);
    });
  });
});
