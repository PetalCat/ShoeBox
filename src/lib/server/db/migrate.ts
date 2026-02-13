import Database from 'better-sqlite3';
import { join } from 'path';
import { DATA_DIR } from './index.js';

let migrated = false;

export function runMigrations() {
	if (migrated) return;
	migrated = true;

	const sqlite = new Database(join(DATA_DIR, 'db.sqlite'));

	sqlite.exec(`
		CREATE TABLE IF NOT EXISTS events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			slug TEXT NOT NULL UNIQUE,
			title TEXT NOT NULL,
			description TEXT DEFAULT '',
			created_at TEXT NOT NULL,
			is_public_view INTEGER NOT NULL DEFAULT 0,
			allow_uploads INTEGER NOT NULL DEFAULT 1
		);

		CREATE TABLE IF NOT EXISTS tokens (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
			token TEXT NOT NULL UNIQUE,
			label TEXT DEFAULT '',
			permission TEXT NOT NULL DEFAULT 'view',
			expires_at TEXT,
			revoked_at TEXT,
			created_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS media (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
			uuid TEXT NOT NULL UNIQUE,
			original_name TEXT NOT NULL,
			stored_relpath TEXT NOT NULL,
			mime TEXT NOT NULL,
			kind TEXT NOT NULL,
			size_bytes INTEGER NOT NULL,
			width INTEGER,
			height INTEGER,
			duration_seconds REAL,
			created_at TEXT NOT NULL,
			uploader_name TEXT DEFAULT '',
			sha256 TEXT NOT NULL,
			phash TEXT
		);

		CREATE TABLE IF NOT EXISTS admin_users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			username TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			created_at TEXT NOT NULL
		);

		CREATE TABLE IF NOT EXISTS sessions (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			admin_user_id INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
			token TEXT NOT NULL UNIQUE,
			expires_at TEXT NOT NULL,
			created_at TEXT NOT NULL
		);

		CREATE INDEX IF NOT EXISTS idx_media_event_id ON media(event_id);
		CREATE INDEX IF NOT EXISTS idx_media_event_created ON media(event_id, created_at);
	`);

	sqlite.close();
}
