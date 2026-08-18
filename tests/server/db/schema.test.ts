/**
 * Schema validation tests — verifies that all migrations produce the correct tables,
 * columns, types, and constraints.
 *
 * Each test creates a fresh in-memory DB, runs migrations, then inspects the schema
 * via SQLite's `PRAGMA table_info` and `PRAGMA foreign_key_list`.
 */
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, closeTestDb, type TestDb } from "./testDb";
import { runMigrations } from "../../../src/server/db/migrate";

describe("migration runner", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
  });

  afterEach(() => {
    closeTestDb(db);
  });

  it("applies all migrations and returns applied file names", () => {
    const result = runMigrations(db);

    expect(result.applied).toContain("001_user.sql");
    expect(result.applied).toContain("002_session.sql");
    expect(result.applied).toContain("003_challenge.sql");
    expect(result.applied).toHaveLength(3);
  });

  it("is idempotent — second run applies nothing", () => {
    runMigrations(db);
    const result = runMigrations(db);

    expect(result.applied).toHaveLength(0);
    expect(result.skipped).toHaveLength(3);
  });
});

describe("User table", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
    runMigrations(db);
  });

  afterEach(() => {
    closeTestDb(db);
  });

  function getColumns(table: string) {
    return db.prepare(`PRAGMA table_info(${table})`).all() as {
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: unknown;
      pk: number;
    }[];
  }

  it("exists", () => {
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
      )
      .get();
    expect(tables).toBeDefined();
  });

  it("has id column (INTEGER PRIMARY KEY)", () => {
    const cols = getColumns("users");
    const id = cols.find(c => c.name === "id");
    expect(id).toBeDefined();
    expect(id?.type).toBe("INTEGER");
    expect(id?.pk).toBe(1);
  });

  it("has email column (TEXT NOT NULL UNIQUE)", () => {
    const cols = getColumns("users");
    const email = cols.find(c => c.name === "email");
    expect(email).toBeDefined();
    expect(email?.type).toBe("TEXT");
    expect(email?.notnull).toBe(1);
  });

  it("has name column (TEXT NOT NULL)", () => {
    const cols = getColumns("users");
    const name = cols.find(c => c.name === "name");
    expect(name).toBeDefined();
    expect(name?.type).toBe("TEXT");
    expect(name?.notnull).toBe(1);
  });

  it("has avatar_url column (TEXT nullable)", () => {
    const cols = getColumns("users");
    const avatar = cols.find(c => c.name === "avatar_url");
    expect(avatar).toBeDefined();
    expect(avatar?.type).toBe("TEXT");
    expect(avatar?.notnull).toBe(0);
  });

  it("has created_at column (TEXT NOT NULL with default)", () => {
    const cols = getColumns("users");
    const created = cols.find(c => c.name === "created_at");
    expect(created).toBeDefined();
    expect(created?.type).toBe("TEXT");
    expect(created?.notnull).toBe(1);
    expect(created?.dflt_value).toBe("datetime('now')");
  });

  it("rejects duplicate emails (UNIQUE constraint)", () => {
    const insert = db.prepare(
      "INSERT INTO users (email, name) VALUES (?, ?)"
    );
    insert.run("test@example.com", "Test User");
    expect(() =>
      insert.run("test@example.com", "Another User")
    ).toThrow();
  });

  it("accepts a valid user insert", () => {
    const insert = db.prepare(
      "INSERT INTO users (email, name, avatar_url) VALUES (?, ?, ?)"
    );
    const info = insert.run("test@example.com", "Test User", "https://img.png");

    const row = db
      .prepare("SELECT * FROM users WHERE email = ?")
      .get("test@example.com") as { id: number; email: string; name: string };
    expect(row.email).toBe("test@example.com");
    expect(row.name).toBe("Test User");
    expect(info.changes).toBe(1);
  });
});

describe("Session table", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
    runMigrations(db);
  });

  afterEach(() => {
    closeTestDb(db);
  });

  function getColumns(table: string) {
    return db.prepare(`PRAGMA table_info(${table})`).all() as {
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: unknown;
      pk: number;
    }[];
  }

  it("exists", () => {
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='sessions'"
      )
      .get();
    expect(tables).toBeDefined();
  });

  it("has id column (INTEGER PRIMARY KEY)", () => {
    const cols = getColumns("sessions");
    const id = cols.find(c => c.name === "id");
    expect(id).toBeDefined();
    expect(id?.type).toBe("INTEGER");
    expect(id?.pk).toBe(1);
  });

  it("has user_id column (INTEGER NOT NULL)", () => {
    const cols = getColumns("sessions");
    const userId = cols.find(c => c.name === "user_id");
    expect(userId).toBeDefined();
    expect(userId?.type).toBe("INTEGER");
    expect(userId?.notnull).toBe(1);
  });

  it("has token column (TEXT NOT NULL UNIQUE)", () => {
    const cols = getColumns("sessions");
    const token = cols.find(c => c.name === "token");
    expect(token).toBeDefined();
    expect(token?.type).toBe("TEXT");
    expect(token?.notnull).toBe(1);
  });

  it("has expires_at column (TEXT NOT NULL)", () => {
    const cols = getColumns("sessions");
    const expires = cols.find(c => c.name === "expires_at");
    expect(expires).toBeDefined();
    expect(expires?.type).toBe("TEXT");
    expect(expires?.notnull).toBe(1);
  });

  it("has FK user_id → users(id) ON DELETE CASCADE", () => {
    const fks = db
      .prepare("PRAGMA foreign_key_list(sessions)")
      .all() as { table: string; from: string; to: string; on_delete: string }[];

    const fk = fks.find(f => f.from === "user_id");
    expect(fk).toBeDefined();
    expect(fk?.table).toBe("users");
    expect(fk?.on_delete).toBe("CASCADE");
  });

  it("rejects session with non-existent user_id", () => {
    const insert = db.prepare(
      "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)"
    );
    expect(() =>
      insert.run(999, "fake-token", "2099-12-31T23:59:59Z")
    ).toThrow();
  });
});

describe("Challenge table", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
    runMigrations(db);
  });

  afterEach(() => {
    closeTestDb(db);
  });

  function getColumns(table: string) {
    return db.prepare(`PRAGMA table_info(${table})`).all() as {
      cid: number;
      name: string;
      type: string;
      notnull: number;
      dflt_value: unknown;
      pk: number;
    }[];
  }

  it("exists", () => {
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='challenges'"
      )
      .get();
    expect(tables).toBeDefined();
  });

  it("has id column (INTEGER PRIMARY KEY)", () => {
    const cols = getColumns("challenges");
    const id = cols.find(c => c.name === "id");
    expect(id).toBeDefined();
    expect(id?.type).toBe("INTEGER");
    expect(id?.pk).toBe(1);
  });

  it("has user_id column (INTEGER NOT NULL)", () => {
    const cols = getColumns("challenges");
    const userId = cols.find(c => c.name === "user_id");
    expect(userId).toBeDefined();
    expect(userId?.type).toBe("INTEGER");
    expect(userId?.notnull).toBe(1);
  });

  it("has name column (TEXT NOT NULL)", () => {
    const cols = getColumns("challenges");
    const name = cols.find(c => c.name === "name");
    expect(name).toBeDefined();
    expect(name?.type).toBe("TEXT");
    expect(name?.notnull).toBe(1);
  });

  it("has type column (TEXT NOT NULL with CHECK constraint)", () => {
    const cols = getColumns("challenges");
    const type = cols.find(c => c.name === "type");
    expect(type).toBeDefined();
    expect(type?.type).toBe("TEXT");
    expect(type?.notnull).toBe(1);
  });

  it("has duration column (INTEGER nullable)", () => {
    const cols = getColumns("challenges");
    const dur = cols.find(c => c.name === "duration");
    expect(dur).toBeDefined();
    expect(dur?.type).toBe("INTEGER");
    expect(dur?.notnull).toBe(0);
  });

  it("has deadline column (TEXT nullable)", () => {
    const cols = getColumns("challenges");
    const dl = cols.find(c => c.name === "deadline");
    expect(dl).toBeDefined();
    expect(dl?.type).toBe("TEXT");
    expect(dl?.notnull).toBe(0);
  });

  it("has created_at column (TEXT NOT NULL with default)", () => {
    const cols = getColumns("challenges");
    const created = cols.find(c => c.name === "created_at");
    expect(created).toBeDefined();
    expect(created?.type).toBe("TEXT");
    expect(created?.notnull).toBe(1);
    expect(created?.dflt_value).toBe("datetime('now')");
  });

  it("has FK user_id → users(id) ON DELETE CASCADE", () => {
    const fks = db
      .prepare("PRAGMA foreign_key_list(challenges)")
      .all() as { table: string; from: string; to: string; on_delete: string }[];

    const fk = fks.find(f => f.from === "user_id");
    expect(fk).toBeDefined();
    expect(fk?.table).toBe("users");
    expect(fk?.on_delete).toBe("CASCADE");
  });

  it("enforces type CHECK constraint (streak / one-off only)", () => {
    const user = db
      .prepare("INSERT INTO users (email, name) VALUES (?, ?)")
      .run("test@example.com", "Test");
    const userId = user.lastInsertRowid as number;

    const insert = db.prepare(
      "INSERT INTO challenges (user_id, name, type) VALUES (?, ?, ?)"
    );
    insert.run(userId, "Run daily", "streak"); // valid
    insert.run(userId, "Finish project", "one-off"); // valid

    expect(() =>
      insert.run(userId, "Invalid type", "weekly")
    ).toThrow();
  });

  it("rejects challenge with non-existent user_id", () => {
    const insert = db.prepare(
      "INSERT INTO challenges (user_id, name, type) VALUES (?, ?, ?)"
    );
    expect(() =>
      insert.run(999, "Fake challenge", "streak")
    ).toThrow();
  });
});
