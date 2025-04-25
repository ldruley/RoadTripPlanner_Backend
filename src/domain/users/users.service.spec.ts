import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './repository/users.repository';
import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user-dto';

// Mock bcrypt
jest.mock('bcrypt');

describe('UsersService', () => {
  let service: UsersService;
  let repository: jest.Mocked<UsersRepository>;

  const mockUser = {
    user_id: 1,
    username: 'testuser',
    fullname: 'Test User',
    email: 'test@example.com',
    password_hash: 'hashedPassword',
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(async () => {
    // Create mock repository
    const mockRepository = {
      findByEmail: jest.fn(),
      findByUsername: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      username: 'newuser',
      fullname: 'New User',
      email: 'new@example.com',
      password: 'password123',
    };

    it('should create a new user successfully', async () => {
      // Mock that email doesn't exist
      repository.findByEmail.mockResolvedValue(null);

      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');

      // Mock repository create and save
      repository.create.mockReturnValue(mockUser as User);
      repository.save.mockResolvedValue(mockUser as User);

      const result = await service.create(createUserDto);

      expect(repository.findByEmail).toHaveBeenCalledWith(createUserDto.email);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);

      expect(repository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password_hash: 'hashedPassword',
      });
      expect(repository.save).toHaveBeenCalled();
      expect(result).toEqual(mockUser);
    });

    it('should throw ConflictException if email already exists', async () => {
      // Mock that email exists
      repository.findByEmail.mockResolvedValue(mockUser as User);

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException,
      );

      expect(repository.findByEmail).toHaveBeenCalledWith(createUserDto.email);

      expect(repository.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return a user when found', async () => {
      repository.findOne.mockResolvedValue(mockUser as User);

      const result = await service.findOne(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1 },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    const updateUserDto = {
      username: 'updateduser',
      fullname: 'Updated User',
    };

    it('should update user successfully', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      repository.findOne.mockResolvedValue(mockUser as User);
      repository.save.mockResolvedValue(updatedUser as User);

      const result = await service.update(1, updateUserDto);

      expect(result).toEqual(updatedUser);

      expect(repository.save).toHaveBeenCalled();
    });

    it('should hash password when password is updated', async () => {
      const updateWithPassword = {
        ...updateUserDto,
        password: 'newpassword123',
      };

      repository.findOne.mockResolvedValue(mockUser as User);
      (bcrypt.hash as jest.Mock).mockResolvedValue('newHashedPassword');
      repository.save.mockResolvedValue(mockUser as User);

      await service.update(1, updateWithPassword);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword123', 10);
    });
  });

  describe('remove', () => {
    it('should remove user successfully', async () => {
      repository.findOne.mockResolvedValue(mockUser as User);
      repository.remove.mockResolvedValue(mockUser as User);

      await service.remove(1);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { user_id: 1 },
      });

      expect(repository.remove).toHaveBeenCalledWith(mockUser);
    });

    it('should throw NotFoundException when user not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);

      expect(repository.remove).not.toHaveBeenCalled();
    });
  });
});
