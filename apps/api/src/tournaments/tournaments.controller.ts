import { Controller, Get, Query } from "@nestjs/common";
import { ListTournamentsQueryDto } from "./list-tournaments-query.dto.js";
import { TournamentService } from "./tournaments.service.js";

@Controller('tournaments')
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentService) {}

    @Get()
    getTournaments(@Query() query: ListTournamentsQueryDto) {
        return this.tournamentsService.getTournaments(query);
    }
}