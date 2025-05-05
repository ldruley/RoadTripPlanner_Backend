import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../../domain/users/dto/create-user-dto';
import { RegisterDto } from './dto/register.dto';
import { AuthGuard } from '@nestjs/passport';
import { OAuthResponse } from '../../common/types/oauth-response.interface';
import { Request, Response } from 'express';

interface GoogleCallbackRequest extends Request {
  user: OAuthResponse;
}


@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password (hashed)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('loginPlain')
  @ApiOperation({ summary: 'Login with email and password (not hashed)' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  loginPlain(@Body() loginDto: LoginDto) {
    return this.authService.loginPlaintext(loginDto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Email already in use' })
  register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  googleAuth(@Req() _req: Request, @Res() _res: Response): void {
    // DO NOTHING – passport will handle it
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  googleAuthCallback(@Req() req: GoogleCallbackRequest, @Res() res: Response) {
    const { access_token, user, platform } = req.user;

    if (platform === 'mobile') {
      return res.redirect(`myapp://redirect?token=${access_token}`);
    }

    return res.redirect(
      `http://localhost:8081/google-web-redirect?token=${access_token}`,
    );
  }
}
