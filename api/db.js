// /api/db.js

import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import logger from "./logger.js";

dotenv.config();

// Ensure the DATABASE_URL environment variable is set
if (!process.env.DATABASE_URL) {
	logger.error("DATABASE_URL is not defined in the environment variables.");
	process.exit(1);
}

/**
 * Create a new PostgreSQL connection pool.
 * Using a pool allows for efficient query handling and connection reuse.
 */
const pool = new Pool({
	connectionString: process.env.DATABASE_URL,
});

// Log when a new client connects (optional, can be verbose in high-traffic apps)
pool.on("connect", () => {
	logger.info("A new client has connected to the database.");
});

// Log errors on the pool and exit if an unexpected error occurs
pool.on("error", (err) => {
	logger.error("Unexpected error on idle client:", { error: err });
	process.exit(-1);
});

export { pool };
