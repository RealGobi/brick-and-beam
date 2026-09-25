import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy server/.env.example to server/.env.");
}

/** Shared connection pool. Use as a tagged template: sql`select * from projects` */
export const sql = postgres(databaseUrl);

/** Runs a trivial query to confirm the database is reachable. */
export async function checkDatabaseConnection(): Promise<void> {
  await sql`select 1`;
}
