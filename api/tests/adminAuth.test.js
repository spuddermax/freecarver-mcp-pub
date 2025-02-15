// /api/tests/adminAuth.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../app.js";
import { pool } from "../db.js";

describe("Admin Authentication Routes", () => {
	const testEmail = "admin@example.com";
	const testPassword = "password"; // Plain-text password for testing
	let testAdmin;

	// Seed an admin role and a test admin user before running the tests
	beforeAll(async () => {
		// Ensure that an admin role with id = 1 exists
		await pool.query(
			`INSERT INTO admin_roles (id, role_name)
       VALUES (1, 'admin')
       ON CONFLICT (id) DO NOTHING`
		);

		// Insert a test admin user
		const hashedPassword = await bcrypt.hash(testPassword, 10);
		const result = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, 'Test', 'Admin', 1) RETURNING *`,
			[testEmail, hashedPassword]
		);
		testAdmin = result.rows[0];
	});

	// Clean up the test admin user after tests complete
	afterAll(async () => {
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			testEmail,
		]);
		// Global teardown will handle closing the connection pool.
	});

	describe("POST /v1/adminAuth/login", () => {
		it("should return 422 if email or password is missing", async () => {
			const res = await request(app)
				.post("/v1/adminAuth/login")
				.send({ email: testEmail }); // Missing password
			expect(res.statusCode).toEqual(422);
			expect(res.body.message).toEqual(
				"Email and password are required."
			);
		});

		it("should return 200 and a token if valid credentials are provided", async () => {
			const res = await request(app)
				.post("/v1/adminAuth/login")
				.send({ email: testEmail, password: testPassword });
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.token).toBeDefined();
		});

		it("should return 401 if invalid credentials are provided (wrong password)", async () => {
			const res = await request(app)
				.post("/v1/adminAuth/login")
				.send({ email: testEmail, password: "wrongpassword" });
			expect(res.statusCode).toEqual(401);
			expect(res.body.message).toEqual("Invalid credentials.");
		});

		it("should return 401 if email is not found", async () => {
			const res = await request(app).post("/v1/adminAuth/login").send({
				email: "nonexistent@example.com",
				password: testPassword,
			});
			expect(res.statusCode).toEqual(401);
			expect(res.body.message).toEqual("Invalid credentials.");
		});
	});

	describe("GET /v1/adminAuth/me", () => {
		it("should return 401 if no token is provided", async () => {
			const res = await request(app).get("/v1/adminAuth/me");
			expect(res.statusCode).toEqual(401);
			expect(res.body.error).toEqual("No token provided");
		});

		it("should return 200 with admin details if a valid token is provided", async () => {
			// First, log in to obtain a valid token
			const loginRes = await request(app)
				.post("/v1/adminAuth/login")
				.send({ email: testEmail, password: testPassword });
			expect(loginRes.statusCode).toEqual(200);
			const token = loginRes.body.data.token;

			// Use the token to access the protected route
			const res = await request(app)
				.get("/v1/adminAuth/me")
				.set("Authorization", `Bearer ${token}`);
			console.log(res.body.data.admin);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.admin).toBeDefined();
			expect(res.body.data.admin.adminEmail).toEqual(testEmail);
		});
	});
});
