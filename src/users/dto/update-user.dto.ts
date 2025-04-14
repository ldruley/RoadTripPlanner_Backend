import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
    @ApiProperty({ example: 'johndoe', required: false })
    @IsOptional()
    @IsString()
    username?: string;

    @ApiProperty({ example: 'John Doe', required: false })
    @IsOptional()
    @IsString()
    fullname?: string;

    @ApiProperty({ example: 'john.doe@example.com', required: false })
    @IsOptional()
    @IsEmail()
    email?: string;

    @ApiProperty({ example: 'newPassword123', required: false })
    @IsOptional()
    @IsString()
    @MinLength(8)
    password?: string;
}