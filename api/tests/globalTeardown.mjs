// /api/tests/globalTeardown.mjs

import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables from .env.test at the project root
dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

export default async function globalTeardown() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not defined in .env.test");
	}
	// Extract the database name from the connection string.
	const dbName = databaseUrl.split("/").pop();

	try {
		console.log(
			`Terminating all connections to the database "${dbName}"...`
		);
		// This SQL command terminates all other connections to the test database.
		execSync(
			`psql ${databaseUrl} -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName}' AND pid <> pg_backend_pid();"`,
			{ stdio: "inherit" }
		);

		console.log(
			`Dropping test database "${dbName}" as part of global teardown...`
		);
		execSync(`dropdb ${dbName}`, { stdio: "inherit" });
		console.log("Test database dropped successfully.");
	} catch (err) {
		console.warn(
			`Warning: Could not drop database "${dbName}" during teardown.`,
			err.message
		);
	}
}
