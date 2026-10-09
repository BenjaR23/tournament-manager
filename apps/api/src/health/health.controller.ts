import { Controller, Get } from "@nestjs/common";

@Controller('health')
export class HealthController {
    @Get()
    healthCheck(): { status: string} {
        return { status: 'ok' };
    }
}