import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { JwtAuthGuard } from './jwt-auth.guard.js';

if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not defined.');
}

@Module({
    imports: [JwtModule.register({
        secret: process.env.JWT_SECRET,
        signOptions: {
            expiresIn: '1d',
        },
    })],
    providers: [JwtAuthGuard],
    exports: [JwtModule, JwtAuthGuard],
})
export class JwtAuthModule {}