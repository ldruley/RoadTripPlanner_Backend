import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import {CreateUserDto} from "../users/dto/create-user-dto";
import {RegisterDto} from "./dto/register.dto";

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) {}

    async validateUser(email: string, password: string): Promise<any> {
        const user = await this.usersService.findByEmail(email);

        if (user && await bcrypt.compare(password, user.password_hash)) {
            const { password_hash, ...result } = user;
            return result;
        }

        return null;
    }

    async login(loginDto: LoginDto) {
        const user = await this.validateUser(loginDto.email, loginDto.password);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { email: user.email, sub: user.user_id };

        return {
            access_token: this.jwtService.sign(payload),
            user,
        };
    }

    async register(registerDto: RegisterDto) {
        // The UsersService.create method already handles duplicate email checking
        const user = await this.usersService.create(registerDto);

        // Generate token so no need to login
        const payload = { email: user.email, sub: user.user_id };

        return {
            message: 'User registered successfully',
            access_token: this.jwtService.sign(payload),
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                fullname: user.fullname,
            },
        };
    }
}