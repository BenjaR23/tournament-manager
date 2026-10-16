import { IsEmail, IsString, MinLength, MaxLength } from "class-validator";

export class RegisterDto {
    @IsString()
    @MinLength(3)
    @MaxLength(20)
    username: string;

    @IsString()
    @IsEmail()
    email: string;

    @IsString()
    @MinLength(8)
    @MaxLength(72)
    password: string;
}