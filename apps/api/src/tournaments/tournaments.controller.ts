import { Controller, Get, Query } from "@nestjs/common";
import { ListTournamentsQueryDto } from "./dto/list-tournaments-query.dto.js";
import { TournamentsService } from "./tournaments.service.js";

@Controller('tournaments')
export class TournamentsController {
    constructor(private readonly tournamentsService: TournamentsService) {}

    @Get()
    getTournaments(@Query() query: ListTournamentsQueryDto) {
        return this.tournamentsService.getTournaments(query);
    }
}