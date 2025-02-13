// /api/tests/setup.js

import { pool } from "../db.js";

// Run before each test
beforeEach(async () => {
	// Optionally, you can begin a transaction
	await pool.query("BEGIN");
});

// Run after each test
afterEach(async () => {
	// Rollback any changes
	await pool.query("ROLLBACK");
});
