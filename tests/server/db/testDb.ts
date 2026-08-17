/**
 * In-memory SQLite helper for server tests.
 *
 * Separate from `tests/setup.ts` (client-only — wired to jsdom/testing-library
 * via `vitest.client.config.ts`). Server tests that need a DB call
 * `createTestDb()` directly, per-test or per-suite, rather than relying on a
 * shared global setup file.
 */
import Database from "better-sqlite3";

export type TestDb = InstanceType<typeof Database>;

/**
 * Creates a fresh in-memory SQLite database. Each call is fully isolated —
 * no shared state between tests, no teardown needed beyond `.close()`.
 */
export function createTestDb(): TestDb {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
  return db;
}

/** Closes the database connection. Call in `afterEach`/`afterAll`. */
export function closeTestDb(db: TestDb): void {
  db.close();
}
