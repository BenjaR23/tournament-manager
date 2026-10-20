import { IsString, IsOptional, MinLength, MaxLength, IsDateString, IsInt, ValidateIf, IsDefined, Min, Max, IsNotEmpty, IsUUID, IsEnum, IsIn, IsDivisibleBy } from "class-validator";
import { TournamentFormat } from "../../generated/prisma/enums.js";

export class CreateTournamentDto {
    @IsString()
    @IsNotEmpty()
    @MinLength(3)
    @MaxLength(80)
    name: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsDateString()
    startsAt: string;

    @IsUUID()
    gameId: string;

    @IsInt()
    @IsDivisibleBy(2)
    @Min(2)
    @Max(128)
    maxPlayers: number;

    @IsEnum(TournamentFormat)
    format: TournamentFormat;

    @IsInt()
    @IsNotEmpty()
    @IsIn([1, 3, 5])
    seriesBestOf: number;

    @ValidateIf((dto) => dto.format === TournamentFormat.GROUP_STAGE)
    @IsDefined()
    @IsInt()
    @Min(1)
    @Max(5)
    groupMatchesPerOpponent?: number;
}