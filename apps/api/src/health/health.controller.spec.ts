import { HealthController } from "./health.controller.js";

describe('HealthController', () => {
    let healthController: HealthController;

    beforeEach(() => {
        healthController = new HealthController();
    });

    describe('HealthCheck', () => {
        it('should return status ok', () => {
            expect(healthController.healthCheck()).toEqual({
                status: 'ok',
            });
        });
    });
});