import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

export const isDbConfigured = Boolean(process.env.SQL_HOST);

// Function to create or retrieve the connection pool.
export const createPool = (): Pool | undefined => {
  if (!process.env.SQL_HOST) {
    return undefined;
  }
  if (!global._postgresPool) {
    global._postgresPool = new Pool({
      host: process.env.SQL_HOST,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      port: process.env.SQL_PORT ? parseInt(process.env.SQL_PORT, 10) : 5432,
      max: 10,
      connectionTimeoutMillis: 4000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.warn('PostgreSQL idle client notice:', err.message);
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema if pool is available.
export const db: NodePgDatabase<typeof schema> | null = pool ? drizzle(pool, { schema }) : null;

