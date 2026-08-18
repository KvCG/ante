/**
 * SQLite migration runner.
 *
 * Reads numbered SQL files from the migrations/ directory and applies
 * them in order, tracking applied migrations in a `migrations` table.
 *
 * Usage:
 *   import { runMigrations } from './db/migrate';
 *   const db = new Database(':memory:');
 *   await runMigrations(db);
 */
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, readdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MIGRATIONS_DIR = join(__dirname, 'migrations');

interface MigrationResult {
    applied: string[];
    skipped: string[];
}

/**
 * Applies all pending migrations to the given database.
 * Idempotent — running it twice applies nothing the second time.
 */
export function runMigrations(db: ReturnType<typeof import('better-sqlite3')>): MigrationResult {
    // Ensure migrations tracking table exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        )
    `);

    // Get already-applied migrations
    const appliedRows = db.prepare('SELECT name FROM migrations').all() as { name: string }[];
    const appliedSet = new Set(appliedRows.map(r => r.name));

    // Read and sort migration files
    const files = readdirSync(MIGRATIONS_DIR)
        .filter(f => f.endsWith('.sql'))
        .sort();

    const applied: string[] = [];
    const skipped: string[] = [];

    for (const file of files) {
        if (appliedSet.has(file)) {
            skipped.push(file);
            continue;
        }

        const sql = readFileSync(join(MIGRATIONS_DIR, file), 'utf-8');

        // Wrap in transaction for atomicity
        const txn = db.transaction((sqlText: string) => {
            db.exec(sqlText);
            db.prepare('INSERT INTO migrations (name) VALUES (?)').run(file);
        });

        txn(sql);
        applied.push(file);
    }

    return { applied, skipped };
}
