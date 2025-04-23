import {IsEmail, IsNotEmpty, IsString, MinLength} from 'class-validator';
import {ApiProperty} from "@nestjs/swagger";

export class LoginDto {
    @ApiProperty({
        example: 'user@example.com',
        description: 'User email address',
        format: 'email'
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        example: 'password123',
        description: 'User password',
        minLength: 8,
        format: 'password'
    })
    @IsNotEmpty()
    @IsString()
    @MinLength(8)
    password: string;
}