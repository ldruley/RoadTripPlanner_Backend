import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    example: 'johndoe',
    description: 'Updated username',
    required: false,
    minLength: 3,
  })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Updated full name',
    required: false,
  })
  @IsOptional()
  @IsString()
  fullname?: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Updated email address',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password (min 8 characters)',
    required: false,
    minLength: 8,
    format: 'password',
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;
}
