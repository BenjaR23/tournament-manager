import { Type } from 'class-transformer';
import { IsString, IsInt, Max, Min, IsOptional, Matches, IsIn, registerDecorator } from 'class-validator';

export class ListTournamentsQueryDto {
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page: number = 1;

    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit: number = 12;

    @IsOptional()
    @IsString()
    game?: string;

    @IsOptional()
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    @IsRealDate()
    date?: string;

    @IsOptional()
    @IsIn(['asc', 'desc'])
    participantsOrder: 'asc' | 'desc' = 'desc';
}

function isRealDate(value: string): boolean {
    const [year, month, day] = value.split('-').map(Number);

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month -1 &&
        date.getUTCDate() === day
    );
}

function IsRealDate() {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isRealDate',
            target: object.constructor,
            propertyName,
            validator: {
                validate(value: unknown) {
                    return typeof value === 'string' && isRealDate(value);
                },
            },
        });
    };
}