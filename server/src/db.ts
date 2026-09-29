import postgres from "postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set. Copy server/.env.example to server/.env.");
}

const DATE_TYPE_OID = 1082;

/**
 * Shared connection pool. Use as a tagged template: sql`select * from projects`
 * Column names are converted from snake_case to camelCase, so created_at becomes createdAt.
 */
export const sql = postgres(databaseUrl, {
  transform: postgres.camel,
  types: {
    // Keep date columns as "YYYY-MM-DD" strings. The default turns them into a Date at
    // local midnight, which shifts to the previous day when sent to the client as UTC.
    date: {
      to: DATE_TYPE_OID,
      from: [DATE_TYPE_OID],
      serialize: (value: string) => value,
      parse: (value: string) => value,
    },
  },
  // Postgres sends harmless notices like "table already exists, skipping"
  onnotice: () => {},
});

/** Runs a trivial query to confirm the database is reachable. */
export async function checkDatabaseConnection(): Promise<void> {
  await sql`select 1`;
}
