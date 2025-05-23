// /api/tests/system.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("System Routes", () => {
	let authToken;
	let adminUser;

	beforeAll(async () => {
		// Ensure an admin role with id = 1 exists
		await pool.query(`
      INSERT INTO admin_roles (id, role_name)
      VALUES (1, 'admin')
      ON CONFLICT (id) DO NOTHING
    `);

		// Create an admin user for authentication
		const password = "password";
		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, 'System', 'Admin', 1) RETURNING *`,
			["system_admin@example.com", hashedPassword]
		);
		adminUser = result.rows[0];

		// Generate a JWT token for authentication
		authToken = jwt.sign(
			{
				id: adminUser.id,
				email: adminUser.email,
				role_id: adminUser.role_id,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);

		// Seed system_preferences with a test preference
		await pool.query(`
      INSERT INTO system_preferences (key, value, description)
      VALUES ('site_name', 'Test Site', 'The name of the site')
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, description = EXCLUDED.description
    `);

		// Seed audit_logs with a dummy entry
		await pool.query(
			`INSERT INTO audit_logs (admin_user_id, crud_action, details, ip_address)
       VALUES ($1, 'CREATE', 'Test log entry', '127.0.0.1')`,
			[adminUser.id]
		);
	});

	afterAll(async () => {
		// Clean up the seeded audit log entry
		await pool.query(
			`DELETE FROM audit_logs WHERE details = 'Test log entry'`
		);

		// Clean up the test admin user
		await pool.query(`DELETE FROM admin_users WHERE email = $1`, [
			"system_admin@example.com",
		]);
		// Optionally, you can clean up system_preferences if desired.
		//await pool.end();
	});

	describe("GET /v1/system/preferences", () => {
		it("should retrieve all system preferences with authorization header", async () => {
			const res = await request(app)
				.get("/v1/system/preferences")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.preferences)).toBe(true);
			const pref = res.body.data.preferences.find(
				(p) => p.key === "site_name"
			);
			expect(pref).toBeDefined();
			expect(pref.value).toEqual("Test Site");
		});

		it("should retrieve all system preferences without authorization header (public)", async () => {
			const res = await request(app).get("/v1/system/preferences");
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.preferences)).toBe(true);
			const pref = res.body.data.preferences.find(
				(p) => p.key === "site_name"
			);
			expect(pref).toBeDefined();
			expect(pref.value).toEqual("Test Site");
		});
	});

	describe("PUT /v1/system/preferences/:key", () => {
		it("should update a system preference with valid token", async () => {
			const newValue = "Updated Site";
			const res = await request(app)
				.put("/v1/system/preferences/site_name")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ value: newValue });
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.preference).toBeDefined();
			expect(res.body.data.preference.value).toEqual(newValue);
		});

		it("should return a validation error if 'value' is missing", async () => {
			const res = await request(app)
				.put("/v1/system/preferences/site_name")
				.set("Authorization", `Bearer ${authToken}`)
				.send({});
			expect(res.statusCode).toEqual(422);
			expect(res.body.error).toBeDefined();
			const hasValueError = res.body.error.some(
				(err) => err.field === "value"
			);
			expect(hasValueError).toBe(true);
		});

		it("should return 404 if the preference key is not found", async () => {
			const res = await request(app)
				.put("/v1/system/preferences/nonexistent")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ value: "anything" });
			expect(res.statusCode).toEqual(404);
			expect(res.body.message).toEqual("System preference not found.");
		});

		it("should return 401 if no auth token is provided", async () => {
			const res = await request(app)
				.put("/v1/system/preferences/site_name")
				.send({ value: "Another Update" });
			expect(res.statusCode).toEqual(401);
		});
	});

	describe("GET /v1/system/audit_logs", () => {
		it("should retrieve audit logs with valid token", async () => {
			const res = await request(app)
				.get("/v1/system/audit_logs")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.audit_logs)).toBe(true);
			const log = res.body.data.audit_logs.find(
				(entry) => entry.details === "Test log entry"
			);
			expect(log).toBeDefined();
		});

		it("should return 401 if no auth token is provided", async () => {
			const res = await request(app).get("/v1/system/audit_logs");
			expect(res.statusCode).toEqual(401);
		});
	});
});

describe("GET /v1/system/database_status", () => {
	it("should retrieve the database status without auth", async () => {
		const res = await request(app).get("/v1/system/database_status");
		expect(res.statusCode).toEqual(200);
		expect(res.body.data.status).toBeDefined();
	});
});
