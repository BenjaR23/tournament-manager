import { Controller, Body, Get, Post, Query, Req, UseGuards, Param, Delete, ParseUUIDPipe } from "@nestjs/common";
import { ListTournamentsQueryDto } from "./dto/list-tournaments-query.dto.js";
import { TournamentsService } from "./tournaments.service.js";
import { CreateTournamentDto } from "./dto/create-tournament.dto.js";
import { JwtAuthGuard } from "../auth/jwt-auth/jwt-auth.guard.js";
import { Request } from "express";
import { OptionalJwtAuthGuard } from "../auth/jwt-auth/optional-jwt-auth.guard.js";

@Controller('tournaments')
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) {}

    @Get()
    getTournaments(@Query() query: ListTournamentsQueryDto) {
        return this.tournamentsService.getTournaments(query);
    }

    @Get(':id')
    @UseGuards(OptionalJwtAuthGuard)
    getTournamentDetail(@Param('id', new ParseUUIDPipe()) id: string, @Req() req: Request & { user?: { userId: string } }) {
        return this.tournamentsService.getTournamentDetail(id, req.user?.userId);
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
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.tournamentsService.joinTournament(id, req.user.userId);
    }

    @Delete(':id/participants')
    @UseGuards(JwtAuthGuard)
    leaveTournament(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.tournamentsService.leaveTournament(id, req.user.userId);
    }

    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    deleteTournament(
        @Param('id', new ParseUUIDPipe()) id: string,
        @Req() req: Request & { user: { userId: string } },
    ) {
        return this.tournamentsService.deleteTournament(id, req.user.userId);
    }
}