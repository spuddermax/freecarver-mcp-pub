import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import { logger } from "./logger.js"; // Corrected import

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
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: false }
			: false, // Enable SSL for production
});

// Log when a new client connects (optional, can be verbose in high-traffic apps)
pool.on("connect", (client) => {
	logger.info("A new database connection has been established.", {
		clientId: client.processID,
	});
});

// Log errors on the pool and exit if an unexpected error occurs
pool.on("error", (err) => {
	logger.error("Unexpected error on idle client", { error: err.message });
	process.exit(-1);
});

/**
 * Executes a query on the database with error handling.
 * Automatically logs queries and errors for easier debugging.
 *
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<object>} - Query result
 */
const query = async (text, params) => {
	const clientIp = "N/A"; // Placeholder if integrating with req.log later
	try {
		logger.info("Executing DB query", {
			query: text,
			params,
			ip: clientIp,
		});
		const result = await pool.query(text, params);
		return result;
	} catch (error) {
		logger.error("Database query error", {
			query: text,
			params,
			error: error.message,
			ip: clientIp,
		});
		throw error;
	}
};

export { pool, query };
