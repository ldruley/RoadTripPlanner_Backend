import { IsEmail, IsString, MinLength } from 'class-validator';

//TODO: API PROPS
export class LoginDto {
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    password: string;
}