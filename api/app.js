// app.js

import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import pkg from "pg";
const { Pool } = pkg;
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import logger from "./logger.js"; // Winston logger
import { verifyJWT } from "./middleware/auth.js"; // Import JWT middleware

const app = express();
const port = process.env.PORT || 3000;

// Enable CORS for your client origin
app.use(
	cors({
		origin: process.env.CORS_ORIGIN, // Replace with your client URL
		credentials: true, // if you use credentials (cookies)
	})
);

// Create a PostgreSQL connection pool
const pool = new Pool({
	connectionString: process.env.DATABASE_URL, // e.g., postgres://username:password@localhost/freecarver_store
});

// Middleware to parse JSON bodies
app.use(express.json());

// Default endpoint
app.get("/", (req, res) => {
	res.status(200).json({ message: "FreeCarver API is running" });
});

// ------------------------
// Validate Database Connection
// ------------------------
app.get("/api/validate_database", async (req, res, next) => {
	const result = await pool.query("SELECT 1");
	res.status(200).json({
		message: "Database connection successful",
		result: result.rowCount,
	});
});

// ------------------------
// Admin Login Endpoint
// ------------------------
app.post("/api/admin/login", async (req, res, next) => {
	const { email, password } = req.body;

	try {
		// Look up the admin user by email
		const result = await pool.query(
			"SELECT * FROM admin_users WHERE email = $1",
			[email]
		);
		if (result.rows.length === 0) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		const adminUser = result.rows[0];

		// Compare provided password with the stored hashed password
		const isMatch = await bcrypt.compare(password, adminUser.password_hash);
		if (!isMatch) {
			return res.status(401).json({ error: "Invalid credentials" });
		}

		// Create token payload (you can include additional claims as needed)
		const tokenPayload = {
			id: adminUser.id,
			firstName: adminUser.first_name,
			avatarUrl: adminUser.avatar_url,
			role: adminUser.role_id, // Optionally include more role details
		};

		// Sign the token (expires in 1 hour)
		const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
			expiresIn: "1h",
		});

		res.status(200).json({ token, adminUser });
	} catch (err) {
		next(err);
	}
});

// ------------------------
// Fetch Admin Users
// ------------------------
app.get("/api/admin/users", verifyJWT, async (req, res, next) => {
	const result = await pool.query("SELECT * FROM admin_users");
	res.status(200).json(result.rows);
});

// ------------------------
// Protected Admin Route Example
// ------------------------
app.get("/api/admin/protected", verifyJWT, (req, res) => {
	res.status(200).json({
		message: "Protected route accessed",
		admin: req.admin,
	});
});

// ------------------------
// Example Error Route
// ------------------------
app.get("/error", (req, res, next) => {
	const error = new Error("This is a test error");
	error.status = 400;
	next(error);
});

// ------------------------
// Centralized Error Handling Middleware
// ------------------------
app.use((err, req, res, next) => {
	logger.error(err.stack);
	res.status(err.status || 500).json({
		error: err.message || "Internal Server Error",
	});
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});
