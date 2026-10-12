import { jest } from '@jest/globals';
import { HealthController } from './health.controller.js';
import { PrismaService } from '../prisma/prisma.service.js';

describe('HealthController', () => {
    let healthController: HealthController;
    let queryRawMock: jest.Mock;

    beforeEach(() => {
        queryRawMock = jest.fn<() => Promise<unknown>>()
            .mockResolvedValue([{ '?column?': 1 }]);

        const prismaServiceMock = {
            $queryRaw: queryRawMock,
        };

        healthController = new HealthController(
            prismaServiceMock as unknown as PrismaService,
        );
    });

    describe('healthCheck', () => {
        it('should return status ok', async () => {
            await expect(healthController.healthCheck()).resolves.toEqual({
                status: 'ok',
            });
        });

        it('should execute a query to check the database connection', async () => {
            await healthController.healthCheck();

            expect(queryRawMock).toHaveBeenCalled();
        });
    });
});
