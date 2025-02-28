// scripts/apply_bigint_migration.js
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { pool } from "../api/db.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function applyMigration() {
	console.log("Applying BIGINT migration...");

	try {
		// Read migration file
		const migrationPath = path.join(
			__dirname,
			"..",
			"migrations",
			"002_alter_product_options_bigint.sql"
		);
		const migrationSQL = fs.readFileSync(migrationPath, "utf8");

		// Begin transaction
		console.log("Beginning transaction...");
		await pool.query("BEGIN");

		// Apply migration
		console.log("Executing migration SQL...");
		await pool.query(migrationSQL);

		// Commit transaction
		console.log("Committing transaction...");
		await pool.query("COMMIT");

		console.log("Migration completed successfully!");
	} catch (error) {
		// Rollback transaction on error
		console.error("Error applying migration:", error);
		await pool.query("ROLLBACK");
		console.error("Transaction rolled back.");
	} finally {
		// Close connection
		await pool.end();
		console.log("Database connection closed.");
	}
}

// Run the migration
applyMigration();
