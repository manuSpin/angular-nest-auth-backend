import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterUserDto {
    @IsEmail()
    email: string;

    @IsString()
    name: string;
4
    @MinLength(6)
    password: string;
}