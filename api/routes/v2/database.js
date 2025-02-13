import { Router } from "express";
import { pool } from "../../db.js"; // Assume you have a separate db.js for PostgreSQL connection

const router = Router();

/**
 * Validate the database connection
 * @param req - The request object
 * @param res - The response object
 * @param next - The next middleware function
 */
router.get("/validate_database", async (req, res, next) => {
	try {
		const result = await pool.query("SELECT 1");
		res.json({
			message: "Database connection successful, v2",
			result: result.rowCount,
		});
	} catch (error) {
		next(error);
	}
});

export default router;
