import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from "./repository/users.repository";
import { User } from "./entities/user.entity";
import { CreateUserDto } from "./dto/create-user-dto";

@Injectable()
export class UsersService {
    constructor(
        private usersRepository: UsersRepository,
    ) {}

    async create(createUserDto: CreateUserDto): Promise<User> {
        const existingUser = await this.usersRepository.findByEmail(createUserDto.email);
        if(existingUser) {
            throw new ConflictException('Email already in use');
        }

        const passwordHash = await bcrypt.hash(createUserDto.password, 10);

        const user = this.usersRepository.create({
            ...createUserDto,
            password_hash: passwordHash,
        });

        return this.usersRepository.save(user);
    }

    async findAll(): Promise<User[]> {
        return this.usersRepository.find();
    }

    async findOne(id: number): Promise<User> {
        const user = await this.usersRepository.findOne({
            where: { user_id: id }
        });

        if (!user) {
            throw new NotFoundException(`User with ID ${id} not found`);
        }

        return user;
    }

    async findByEmail(email: string): Promise<User | null> {
        return this.usersRepository.findByEmail(email);
    }

    async findByUsername(username: string): Promise<User | null> {
        return this.usersRepository.findByUsername(username);
    }
    async update(id: number, updateUserDto: Partial<User>): Promise<User> {
        const user = await this.findOne(id);
        const updates: Partial<User> = {};

        if (updateUserDto.username !== undefined) updates.username = updateUserDto.username;
        if (updateUserDto.fullname !== undefined) updates.fullname = updateUserDto.fullname;
        if (updateUserDto.email !== undefined) updates.email = updateUserDto.email;

        if ('password' in updateUserDto && typeof updateUserDto.password === 'string') {
            updates.password_hash = await bcrypt.hash(updateUserDto.password, 10);
        }

        Object.assign(user, updates);
        return this.usersRepository.save(user);
    }

    async remove(id: number) : Promise<void> {
        const user = await this.findOne(id);
        await this.usersRepository.remove(user);
    }

    async createOAuthUser(userData: Partial<User>): Promise<User> {
        const user = this.usersRepository.create({
          ...userData,
          authProvider: 'google',
          password: null, // since it's OAuth, no password
        });
        return this.usersRepository.save(user);
    }
      

}
