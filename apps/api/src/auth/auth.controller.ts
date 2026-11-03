import { Controller, Post, Body, Delete, UseGuards, Req } from "@nestjs/common";
import { AuthService } from "./auth.service.js";
import { RegisterDto } from "./dto/register.dto.js";
import { LoginDto } from "./dto/login.dto.js";
import { JwtAuthGuard } from "./jwt-auth/jwt-auth.guard.js";
import { DeleteAccountDto } from "./dto/delete-account.dto.js";
import { Request } from "express";

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) {}

    @Post('register')
    register(@Body() registerDto: RegisterDto) {
        return this.authService.register(registerDto);
    }

    @Post('login')
    login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto);
    }

    @Delete('me')
    @UseGuards(JwtAuthGuard)
    deleteAccount(
        @Body() deleteAccountDto: DeleteAccountDto,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.authService.deleteAccount(
            req.user.userId,
            deleteAccountDto.password,
        );
    }
}