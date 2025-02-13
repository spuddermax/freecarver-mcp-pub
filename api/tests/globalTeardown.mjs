// /api/tests/globalTeardown.mjs

import { execSync } from "child_process";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables from .env.test
dotenv.config({ path: path.resolve(process.cwd(), ".env.test") });

export default async function globalTeardown() {
	const databaseUrl = process.env.DATABASE_URL;
	if (!databaseUrl) {
		throw new Error("DATABASE_URL is not defined in .env.test");
	}

	// Extract the database name from the connection string.
	const dbName = databaseUrl.split("/").pop();

	try {
		console.log(
			`Dropping test database "${dbName}" as part of global teardown...`
		);
		execSync(`dropdb ${dbName}`, { stdio: "inherit" });
		console.log("Test database dropped successfully.");
		pool.end();
	} catch (err) {
		console.warn(
			`Warning: Could not drop database "${dbName}" during teardown.`,
			err.message
		);
	}
}
