import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UnauthorizedException } from '@nestjs/common';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: jest.Mocked<AuthService>;

  const mockUser = {
    user_id: 1,
    username: 'testuser',
    email: 'test@example.com',
    fullname: 'Test User',
  };

  const mockAuthResponse = {
    access_token: 'mock-jwt-token',
    user: mockUser,
  };

  beforeEach(async () => {
    const mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get(AuthService) as jest.Mocked<AuthService>;
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should return access token and user on successful login', async () => {
      authService.login.mockResolvedValue(mockAuthResponse);

      const result = await controller.login(loginDto);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(result).toBe(mockAuthResponse);
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      authService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials'),
      );

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      username: 'newuser',
      fullname: 'New User',
      email: 'new@example.com',
      password: 'password123',
    };

    const mockRegisterResponse = {
      message: 'User registered successfully',
      access_token: 'mock-jwt-token',
      user: {
        user_id: 2,
        username: 'newuser',
        email: 'new@example.com',
        fullname: 'New User',
      },
    };

    it('should register user and return access token', async () => {
      authService.register.mockResolvedValue(mockRegisterResponse);

      const result = await controller.register(registerDto);

      expect(authService.register).toHaveBeenCalledWith(registerDto);
      expect(result).toBe(mockRegisterResponse);
    });

    it('should throw ConflictException when email already exists', async () => {
      authService.register.mockRejectedValue(new Error('Email already in use'));

      await expect(controller.register(registerDto)).rejects.toThrow(Error);
    });
  });
});
