import fs from "node:fs";
import path from "node:path";
import { sql } from "./db";

// Migrations run in file name order, so name them 001_..., 002_... and never edit one that has already run
const migrationsDir = path.join(__dirname, "../sql/migrations");

async function listAppliedMigrations(): Promise<Set<string>> {
  await sql`
    create table if not exists schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )
  `;
  const rows = await sql<{ name: string }[]>`select name from schema_migrations`;
  return new Set(rows.map((row) => row.name));
}

async function applyMigration(fileName: string): Promise<void> {
  const migrationSql = fs.readFileSync(path.join(migrationsDir, fileName), "utf8");

  // One transaction per file: a failing migration leaves the database unchanged
  await sql.begin(async (transaction) => {
    await transaction.unsafe(migrationSql);
    await transaction.unsafe("insert into schema_migrations (name) values ($1)", [fileName]);
  });
}

async function migrate(): Promise<void> {
  const applied = await listAppliedMigrations();
  const pending = fs
    .readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql") && !applied.has(fileName))
    .sort();

  for (const fileName of pending) {
    await applyMigration(fileName);
    console.log(`Körde ${fileName}`);
  }

  console.log(pending.length === 0 ? "Databasen är redan uppdaterad" : "Databasen är uppdaterad");
}

migrate()
  .catch((error: Error) => {
    console.error(`Migreringen misslyckades: ${error.message}`);
    process.exitCode = 1;
  })
  // Close the pool so the script can exit
  .finally(() => sql.end());
