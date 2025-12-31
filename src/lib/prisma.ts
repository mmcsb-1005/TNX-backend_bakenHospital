import { PrismaClient } from "../../generated/prisma";
import { PrismaPg } from '@prisma/adapter-pg'; // Import the adapter
import * as pg from 'pg'; // Import the underlying database driver

// 1. Create a pool or client instance from the underlying driver
// We use a connection pool (Pool) which is standard for Node.js backend apps
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set.');
}

const pool = new pg.Pool({ connectionString });
// 2. Instantiate the adapter, passing the driver instance
const adapter = new PrismaPg(pool);


const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// 3. Pass the adapter instance into the PrismaClient constructor
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    adapter, // <-- The required change
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;