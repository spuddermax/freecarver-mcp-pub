// /api/tests/globalTeardown.mjs

import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { pool } from "../db.js"; // Import the connection pool

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
		// Wait before closing the pool
		let seconds = 9;
		console.log(
			`Wait ${seconds + 1} seconds for database connections to end...`
		);
		// Show a countdown timer that overwrites the previous line
		for (let i = seconds; i >= 0; i--) {
			await new Promise((resolve) => setTimeout(resolve, 1000));
			process.stdout.write(`${i}...\r`);
		}
		console.log(
			`Dropping test database "${dbName}" as part of global teardown...`
		);
		execSync(`dropdb ${dbName}`, { stdio: "inherit" });
		console.log("Test database dropped successfully.");

		await pool.end();
	} catch (err) {
		console.warn(
			`Warning: Could not drop database "${dbName}" during teardown.`,
			err.message
		);
	}
}
