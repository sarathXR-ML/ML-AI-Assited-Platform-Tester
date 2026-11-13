import Database from 'better-sqlite3';
import * as path from 'path';
import * as fs from 'fs';

export const DB_PATH = path.resolve(__dirname, '../../results.db');

export interface TestRunRecord {
    id?: number;
    app_name: string;
    test_name: string;
    status: 'pass' | 'fail';
    duration_ms?: number;
    error_message?: string | null;
    screenshot_path?: string | null;
    video_path?: string | null;
    run_timestamp?: string;
    ai_summary?: string | null;
    healing_suggestion?: string | null;
}

/**
 * Initializes and returns the SQLite database instance for test results.
 * Creates the test_runs table and ensures ai_summary and healing_suggestion columns exist.
 */
export function initDb(dbPath: string = DB_PATH): Database.Database {
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }

    const db = new Database(dbPath);

    // Enable WAL mode for performance and concurrent readers
    db.pragma('journal_mode = WAL');

    // Create test_runs table with all required fields
    db.exec(`
        CREATE TABLE IF NOT EXISTS test_runs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT NOT NULL,
            test_name TEXT NOT NULL,
            status TEXT NOT NULL,
            duration_ms INTEGER,
            error_message TEXT,
            screenshot_path TEXT,
            video_path TEXT,
            run_timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            ai_summary TEXT,
            healing_suggestion TEXT
        );
    `);

    // Ensure columns exist in case the table already existed with an older schema
    const columns = db.pragma('table_info(test_runs)') as Array<{ name: string }>;
    const columnNames = new Set(columns.map(col => col.name));

    if (!columnNames.has('ai_summary')) {
        db.exec('ALTER TABLE test_runs ADD COLUMN ai_summary TEXT;');
    }

    if (!columnNames.has('healing_suggestion')) {
        db.exec('ALTER TABLE test_runs ADD COLUMN healing_suggestion TEXT;');
    }

    return db;
}

/**
 * Convenience helper to insert a test run record into results.db
 */
export function recordTestRun(record: TestRunRecord, dbInstance?: Database.Database): number {
    const db = dbInstance || initDb();
    const stmt = db.prepare(`
        INSERT INTO test_runs (
            app_name,
            test_name,
            status,
            duration_ms,
            error_message,
            screenshot_path,
            video_path,
            ai_summary,
            healing_suggestion
        ) VALUES (
            @app_name,
            @test_name,
            @status,
            @duration_ms,
            @error_message,
            @screenshot_path,
            @video_path,
            @ai_summary,
            @healing_suggestion
        )
    `);

    const result = stmt.run({
        app_name: record.app_name,
        test_name: record.test_name,
        status: record.status,
        duration_ms: record.duration_ms ?? null,
        error_message: record.error_message ?? null,
        screenshot_path: record.screenshot_path ?? null,
        video_path: record.video_path ?? null,
        ai_summary: record.ai_summary ?? null,
        healing_suggestion: record.healing_suggestion ?? null,
    });

    return Number(result.lastInsertRowid);
}

// When executed directly, initialize the database schema
if (require.main === module) {
    console.log(`📦 Initializing SQLite results database at: ${DB_PATH}`);
    initDb();
    console.log('✅ Schema initialized with ai_summary and healing_suggestion columns.');
}
