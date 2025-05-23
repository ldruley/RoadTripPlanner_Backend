import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';

@Injectable()
export class UsersService extends BaseService<User> {
  constructor(
    @InjectRepository(User)
    repo: Repository<User>,
  ) {
    super(User, repo);
  }

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
    const repo = this.getRepo(manager);

    const existingUser = await repo.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already in use');
    }
    console.log(createUserDto);
    const passwordHash = createUserDto.password;

    const user = repo.create({
      ...createUserDto,
      password_hash: passwordHash,
    });

    return repo.save(user);
  }

  /**
   * Find a user by ID
   * @param userId The user ID
   * @param manager Optional EntityManager for transaction handling
   * @returns The user if found, or throws exception if not found
   */
  async findOne(userId: number, manager?: EntityManager): Promise<User> {
    return this.findOneOrThrow({ user_id: userId }, manager);
  }

  /**
   * Find a user by email
   * @param email The user email
   * @param manager Optional EntityManager for transaction handling
   * @returns The user if found, or null if not found
   */
  async findByEmail(
    email: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.findOneOrNull({ email }, manager);
  }

  /**
   * Find a user by username
   * @param username The user username
   * @param manager Optional EntityManager for transaction handling
   * @returns The user if found, or null if not found
   */
  async findByUsername(
    username: string,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.findOneOrNull({ username }, manager);
  }

  /**
   * Update a user
   * @param userId The user ID
   * @param updateUserDto The user data to update
   * @param manager Optional EntityManager for transaction handling
   * @returns The updated user
   */
  async updateUser(
    userId: number,
    updateUserDto: Partial<User>,
    manager?: EntityManager,
  ): Promise<User> {
    const user = await this.findOneOrThrow({ user_id: userId }, manager);

    if (updateUserDto.username !== undefined) {
      user.username = updateUserDto.username;
    }

    if (updateUserDto.fullname !== undefined) {
      user.fullname = updateUserDto.fullname;
    }

    if (updateUserDto.email !== undefined) {
      user.email = updateUserDto.email;
    }

    if (
      'password' in updateUserDto &&
      typeof updateUserDto.password === 'string'
    ) {
      user.password_hash = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.save(user, manager);
  }

  /**
   * Remove a user
   * @param userId The user ID
   * @param manager Optional EntityManager for transaction handling
   * @returns void
   */
  async remove(userId: number, manager?: EntityManager): Promise<void> {
    await this.delete({ user_id: userId }, manager);
  }

  async createOAuthUser(
    userData: Partial<User>,
    manager?: EntityManager,
  ): Promise<User> {
    const repo = this.getRepo(manager);

    const user = repo.create({
      ...userData,
      authProvider: 'google',
      password_hash: '',
      // Currently faking it because OAuth doesn't provide password
      // Second option is to rework the user.entity.ts
      // Check that file for more details
    });
    return repo.save(user);
  }

  async findById(
    user_id: number,
    manager?: EntityManager,
  ): Promise<User | null> {
    return this.findOneOrNull({ user_id }, manager);
  }
}
