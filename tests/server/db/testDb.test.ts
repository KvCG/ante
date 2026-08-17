import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createTestDb, closeTestDb, type TestDb } from "./testDb";

describe("test DB helper", () => {
  let db: TestDb;

  beforeEach(() => {
    db = createTestDb();
    db.exec(`
      CREATE TABLE dummy (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
      )
    `);
  });

  afterEach(() => {
    closeTestDb(db);
  });

  it("inserts and reads a record back", () => {
    db.prepare("INSERT INTO dummy (name) VALUES (?)").run("test-record");

    const row = db.prepare("SELECT * FROM dummy WHERE name = ?").get("test-record") as
      | { id: number; name: string }
      | undefined;

    expect(row).toBeDefined();
    expect(row?.name).toBe("test-record");
  });

  it("starts empty on every fresh database (no state leaks between tests)", () => {
    const rows = db.prepare("SELECT * FROM dummy").all();
    expect(rows).toHaveLength(0);
  });
});
