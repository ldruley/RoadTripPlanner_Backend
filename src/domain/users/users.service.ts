import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  //TODO: we still need to check username uniqueness
  /**
   * Create a new user
   * @param createUserDto The user data to create
   * @param manager Optional EntityManager for transaction handling
   * @returns The created user
   */
  async create(
    createUserDto: CreateUserDto,
    manager?: EntityManager,
  ): Promise<User> {
    const repo = manager ? manager.getRepository(User) : this.userRepository;

    const existingUser = await repo.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      ...createUserDto,
      password_hash: passwordHash,
    });

    return this.userRepository.save(user);
  }

  /**
   * Find all users
   * @returns An array of users
   */
  async findAll(): Promise<User[]> {
    return this.userRepository.find();
  }

  /**
   * Find a user by ID
   * @param id The user ID
   * @returns The user if found, or null if not found
   */
  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { user_id: id },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  /**
   * Find a user by email
   * @param email The user email
   * @returns The user if found, or null if not found
   */
  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  /**
   * Find a user by username
   * @param username The user username
   * @returns The user if found, or null if not found
   */
  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  /**
   * Update a user
   * @param id The user ID
   * @param updateUserDto The user data to update
   * @returns The updated user
   */
  async update(id: number, updateUserDto: Partial<User>): Promise<User> {
    const user = await this.findOne(id);
    const updates: Partial<User> = {};

    if (updateUserDto.username !== undefined)
      updates.username = updateUserDto.username;
    if (updateUserDto.fullname !== undefined)
      updates.fullname = updateUserDto.fullname;
    if (updateUserDto.email !== undefined) updates.email = updateUserDto.email;

    if (
      'password' in updateUserDto &&
      typeof updateUserDto.password === 'string'
    ) {
      updates.password_hash = await bcrypt.hash(updateUserDto.password, 10);
    }

    Object.assign(user, updates);
    return this.userRepository.save(user);
  }

  /**
   * Remove a user
   * @param id The user ID
   */
  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.remove(user);
  }
}
