import { serve } from "@hono/node-server";
import { app } from "./app";
import { checkDatabaseConnection } from "./db";

serve({ fetch: app.fetch, port: 3000 }, (info) => {
  console.log(`Servern lyssnar på http://localhost:${info.port}`);
});

// Log the database status on startup so a missing database is noticed right away
checkDatabaseConnection()
  .then(() => console.log("Ansluten till databasen"))
  .catch((error: NodeJS.ErrnoException) => {
    // Connection errors like ECONNREFUSED have an empty message, only a code
    const reason = error.code ?? error.message;
    console.error(`Kunde inte ansluta till databasen (${reason}). Körs den? Starta med: docker compose up -d`);
  });
