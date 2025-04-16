import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
    @ApiProperty({
        example: 'johndoe',
        description: 'Unique username for the user',
        minLength: 3
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(3)
    username: string;

    @ApiProperty({
        example: 'John Doe',
        description: 'User\'s full name'
    })
    @IsNotEmpty()
    @IsString()
    fullname: string;

    @ApiProperty({
        example: 'user@example.com',
        description: 'User\'s email address (must be unique)',
        format: 'email'
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'password123',
        description: 'User password (min 8 characters)',
        minLength: 8,
        format: 'password'
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;
}