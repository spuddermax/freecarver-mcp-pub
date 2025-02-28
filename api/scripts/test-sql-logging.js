// api/scripts/test-sql-logging.js

import { pool, query } from "../db.js";
import dotenv from "dotenv";

dotenv.config();

// Simple test queries to verify SQL logging
async function testSqlLogging() {
	console.log("Starting SQL logging test...");
	console.log(`Current LOG_LEVEL: ${process.env.LOG_LEVEL}`);

	try {
		// Test 1: Simple SELECT query
		console.log("\nTest 1: Simple SELECT query");
		await query("SELECT 1 as test_value");

		// Test 2: Query with parameters
		console.log("\nTest 2: Query with parameters");
		await query("SELECT $1::text as param_value, $2::int as int_value", [
			"test_string",
			42,
		]);

		// Test 3: Query with array parameter
		console.log("\nTest 3: Query with array parameter");
		await query("SELECT * FROM products WHERE id = ANY($1::bigint[])", [
			[1, 2, 3],
		]);

		// Test 4: More complex query that might generate an error
		console.log("\nTest 4: Complex query with JOIN");
		try {
			await query(
				`
				SELECT 
					p.id, p.name, 
					po.id as option_id, po.option_name,
					pov.id as variant_id, pov.name as variant_name
				FROM products p
				LEFT JOIN product_options po ON po.product_id = p.id
				LEFT JOIN product_option_variants pov ON pov.option_id = po.id
				WHERE p.id = $1
				LIMIT 2
			`,
				[25]
			);
		} catch (error) {
			console.log("Expected error in Test 4:", error.message);
		}

		// Test 5: Intentional error for error logging testing
		console.log("\nTest 5: Intentional error query");
		try {
			await query("SELECT * FROM non_existent_table");
		} catch (error) {
			console.log("Expected error in Test 5:", error.message);
		}

		console.log(
			"\nTests completed. Check the log files for detailed SQL logs:"
		);
		console.log("  - Debug logs: /var/log/freecarver-api/debug.log");
		console.log("  - Info logs: /var/log/freecarver-api/info.log");
		console.log("  - Error logs: /var/log/freecarver-api/error.log");
	} catch (error) {
		console.error("Test failed with error:", error);
	} finally {
		// Close the pool
		await pool.end();
	}
}

// Run the test
testSqlLogging();
