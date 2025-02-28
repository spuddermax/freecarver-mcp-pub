import pkg from "pg";
const { Pool } = pkg;
import dotenv from "dotenv";
import { logger } from "./middleware/logger.js"; // Corrected import

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
// pool.on("connect", (client) => {
// 	console.info("A new database connection has been established.", {
// 		clientId: client.processID,
// 	});
// });

// Log errors on the pool and exit if an unexpected error occurs
pool.on("error", (err) => {
	logger.error("Unexpected error on idle client", { error: err.message });
	process.exit(-1);
});

/**
 * Formats SQL query for better readability in logs
 * @param {string} text - SQL query text
 * @param {Array} params - Query parameters
 * @returns {string} - Formatted SQL query
 */
const formatQuery = (text, params) => {
	if (!params || params.length === 0) return text;

	// Create a simple representation of the query with parameters
	let formattedQuery = text;
	try {
		// Replace $1, $2, etc. with actual parameter values
		params.forEach((param, index) => {
			const placeholder = `$${index + 1}`;
			let paramValue;

			if (param === null) {
				paramValue = "NULL";
			} else if (typeof param === "string") {
				paramValue = `'${param.replace(/'/g, "''")}'`;
			} else if (Array.isArray(param)) {
				paramValue = `ARRAY[${param
					.map((item) =>
						typeof item === "string"
							? `'${item.replace(/'/g, "''")}'`
							: item
					)
					.join(", ")}]`;
			} else if (typeof param === "object" && param !== null) {
				paramValue = `'${JSON.stringify(param).replace(/'/g, "''")}'`;
			} else {
				paramValue = param;
			}

			formattedQuery = formattedQuery.replace(
				new RegExp(`\\${placeholder}\\b`, "g"),
				paramValue
			);
		});
	} catch (error) {
		// If formatting fails, just return the original query
		logger.debug(`Error formatting query: ${error.message}`);
		return `${text} -- with params: ${JSON.stringify(params)}`;
	}

	return formattedQuery;
};

/**
 * Executes a query on the database with enhanced logging.
 * Logs detailed query information and PostgreSQL responses at debug level.
 *
 * @param {string} text - SQL query string
 * @param {Array} params - Query parameters
 * @returns {Promise<object>} - Query result
 */
const query = async (text, params) => {
	const startTime = Date.now();
	const clientIp = "N/A"; // Placeholder if integrating with req.log later
	const queryId = `query-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

	try {
		// Basic info logging for all queries
		logger.info(`DB Query [${queryId}] - Executing`, {
			query_brief:
				text.substring(0, 100) + (text.length > 100 ? "..." : ""),
			param_count: params ? params.length : 0,
			ip: clientIp,
		});

		// Detailed debug logging
		logger.debug(`DB Query [${queryId}] - Full details`, {
			query: text,
			params: params,
			formatted_query: formatQuery(text, params),
			ip: clientIp,
		});

		// Execute the query
		const result = await pool.query(text, params);
		const duration = Date.now() - startTime;

		// Log success at info level
		logger.info(`DB Query [${queryId}] - Completed in ${duration}ms`, {
			duration,
			row_count: result.rowCount,
			ip: clientIp,
		});

		// Log detailed results at debug level
		logger.debug(`DB Query [${queryId}] - Response`, {
			duration,
			command: result.command,
			row_count: result.rowCount,
			oid: result.oid,
			fields: result.fields
				? result.fields.map((f) => ({
						name: f.name,
						type: f.dataTypeID,
				  }))
				: [],
			rows_sample:
				result.rows && result.rows.length > 0
					? result.rows.slice(0, Math.min(5, result.rows.length))
					: [],
			rows_count: result.rows ? result.rows.length : 0,
			ip: clientIp,
		});

		return result;
	} catch (error) {
		const duration = Date.now() - startTime;

		// Log error at error level
		logger.error(`DB Query [${queryId}] - Failed after ${duration}ms`, {
			query: text,
			params,
			formatted_query: formatQuery(text, params),
			error: {
				message: error.message,
				code: error.code,
				detail: error.detail,
				hint: error.hint,
				position: error.position,
				internalPosition: error.internalPosition,
				internalQuery: error.internalQuery,
				where: error.where,
				schema: error.schema,
				table: error.table,
				column: error.column,
				dataType: error.dataType,
				constraint: error.constraint,
			},
			duration,
			ip: clientIp,
		});

		throw error;
	}
};

export { pool, query };
