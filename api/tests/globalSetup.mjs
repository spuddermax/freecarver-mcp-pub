// /api/tests/globalSetup.mjs

import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables from .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default async function globalSetup() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not defined in .env.test");
	}

	// Extract the database name from the connection string.
	const dbName = databaseUrl.split("/").pop();

	try {
		console.log(`Dropping test database "${dbName}" if it exists...`);
		execSync(`dropdb ${dbName}`, { stdio: "inherit" });
	} catch (err) {
		console.warn(
			`Warning: Could not drop database "${dbName}". It might not exist.`,
			err.message
		);
	}

	try {
		console.log(`Creating test database "${dbName}"...`);
		execSync(`createdb ${dbName}`, { stdio: "inherit" });
	} catch (err) {
		console.error(
			`Error: Failed to create database "${dbName}".`,
			err.message
		);
		process.exit(1);
	}

	try {
		const migrationPath = path.resolve(
			__dirname,
			"../../migrations/001_create_store_tables.sql"
		);
		console.log(`Running migrations from ${migrationPath}...`);
		execSync(`psql ${databaseUrl} -f ${migrationPath}`, {
			stdio: "inherit",
		});
	} catch (err) {
		console.error("Error: Failed to run migrations.", err.message);
		process.exit(1);
	}

	console.log("Test database setup complete.");
}
