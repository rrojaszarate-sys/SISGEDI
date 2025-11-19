import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createPool, testConnection, executeQuery, executeTransaction } from '../../backend/database/config.js';
import pg from 'pg';

describe('Database Configuration Tests', () => {
  let pool: pg.Pool;

  beforeAll(() => {
    pool = createPool();
  });

  afterAll(async () => {
    await pool.end();
  });

  it('should create a database pool successfully', () => {
    expect(pool).toBeDefined();
    expect(pool).toBeInstanceOf(pg.Pool);
  });

  it('should connect to the database', async () => {
    const result = await testConnection(pool);
    expect(result).toBe(true);
  }, 10000);

  it('should execute a simple query', async () => {
    const result = await executeQuery(pool, 'SELECT 1 as number');
    expect(result).toBeDefined();
    expect(result[0].number).toBe(1);
  });

  it('should execute a query with parameters', async () => {
    const result = await executeQuery(
      pool,
      'SELECT $1::text as message',
      ['Hello World']
    );
    expect(result[0].message).toBe('Hello World');
  });

  it('should execute a transaction successfully', async () => {
    await executeTransaction(pool, [
      { query: 'SELECT 1' },
      { query: 'SELECT 2' }
    ]);
    // Si no lanza error, el test pasa
    expect(true).toBe(true);
  });

  it('should check database extensions are installed', async () => {
    const extensions = await executeQuery<{ extname: string }>(
      pool,
      `SELECT extname FROM pg_extension
       WHERE extname IN ('uuid-ossp', 'unaccent', 'pgcrypto')`
    );

    const extNames = extensions.map(e => e.extname);
    expect(extNames).toContain('uuid-ossp');
    expect(extNames).toContain('unaccent');
    expect(extNames).toContain('pgcrypto');
  }, 10000);
});
