
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const apiDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: resolve(apiDir, '../../.env') });

const {
    POSTGRES_USER,
    POSTGRES_PASSWORD,
    POSTGRES_TEST_DB,
    POSTGRES_TEST_PORT,
} = process.env;

if (
    !POSTGRES_USER ||
    POSTGRES_PASSWORD === undefined ||
    !POSTGRES_TEST_DB ||
    !POSTGRES_TEST_PORT
) {
    console.error('Missing PostgreSQL test configuration in .env');
    process.exit(1);
}

const password = encodeURIComponent(POSTGRES_PASSWORD);

process.env.DATABASE_URL =
    `postgresql://${encodeURIComponent(POSTGRES_USER)}:${password}` +
    `@localhost:${POSTGRES_TEST_PORT}/${POSTGRES_TEST_DB}?schema=public`;

const result = spawnSync(
    process.execPath,
    [
        '--experimental-vm-modules',
        resolve(apiDir, 'node_modules/jest/bin/jest.js'),
        '--config',
        './test/jest-e2e.json',
        ...process.argv.slice(2),
    ],
    {
        cwd: apiDir,
        env: process.env,
        stdio: 'inherit',
    },
);

if (result.error) {
    console.error('Failed to start e2e tests.');
    process.exit(1);
}

process.exit(result.status ?? 1);
