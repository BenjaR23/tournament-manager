import { Controller, Body, Get, Post, Query, Req, UseGuards, Param, Delete } from "@nestjs/common";
import { ListTournamentsQueryDto } from "./dto/list-tournaments-query.dto.js";
import { TournamentsService } from "./tournaments.service.js";
import { CreateTournamentDto } from "./dto/create-tournament.dto.js";
import { JwtAuthGuard } from "../auth/jwt-auth/jwt-auth.guard.js";
import { Request } from "express";

@Controller('tournaments')
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) {}

    @Get()
    getTournaments(@Query() query: ListTournamentsQueryDto) {
        return this.tournamentsService.getTournaments(query);
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    createTournament(
        @Body() body: CreateTournamentDto,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.tournamentsService.createTournament(body, req.user.userId);
    }

    @Post(':id/participants')
    @UseGuards(JwtAuthGuard)
    joinTournament(
        @Param('id') id: string,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.tournamentsService.joinTournament(id, req.user.userId);
    }

    @Delete(':id/participants')
    @UseGuards(JwtAuthGuard)
    leaveTournament(
        @Param('id') id: string,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.tournamentsService.leaveTournament(id, req.user.userId);
    }
}