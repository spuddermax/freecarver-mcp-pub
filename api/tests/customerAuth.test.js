// /api/tests/customerAuth.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import app from "../app.js";
import { pool } from "../db.js";

describe("Customer Authentication Routes", () => {
	const testEmail = "customer@example.com";
	const testPassword = "password"; // Plain-text password for testing
	let testCustomer;

	// Insert a test customer into the database before running tests
	beforeAll(async () => {
		const hashedPassword = await bcrypt.hash(testPassword, 10);
		const result = await pool.query(
			`INSERT INTO customers (email, password_hash, first_name, last_name, phone_number)
       VALUES ($1, $2, 'Test', 'Customer', '1234567890') RETURNING *`,
			[testEmail, hashedPassword]
		);
		testCustomer = result.rows[0];
	});

	// Remove the test customer after tests complete
	afterAll(async () => {
		await pool.query("DELETE FROM customers WHERE email = $1", [testEmail]);
		// Do not call pool.end() here if you're using a global teardown to close the pool.
	});

	describe("POST /v1/customerAuth/login", () => {
		it("should return 422 if email or password is missing", async () => {
			const res = await request(app)
				.post("/v1/customerAuth/login")
				.send({ email: testEmail }); // Missing password
			expect(res.statusCode).toEqual(422);
			expect(res.body.message).toEqual(
				"Email and password are required."
			);
		});

		it("should return 200 and a token if valid credentials are provided", async () => {
			const res = await request(app)
				.post("/v1/customerAuth/login")
				.send({ email: testEmail, password: testPassword });
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.token).toBeDefined();
		});

		it("should return 401 if invalid credentials are provided (wrong password)", async () => {
			const res = await request(app)
				.post("/v1/customerAuth/login")
				.send({ email: testEmail, password: "wrongpassword" });
			expect(res.statusCode).toEqual(401);
			expect(res.body.message).toEqual("Invalid credentials.");
		});

		it("should return 401 if email is not found", async () => {
			const res = await request(app).post("/v1/customerAuth/login").send({
				email: "nonexistent@example.com",
				password: testPassword,
			});
			expect(res.statusCode).toEqual(401);
			expect(res.body.message).toEqual("Invalid credentials.");
		});
	});

	describe("GET /v1/customerAuth/me", () => {
		it("should return 401 if no token is provided", async () => {
			const res = await request(app).get("/v1/customerAuth/me");
			expect(res.statusCode).toEqual(401);
			expect(res.body.error).toEqual("No token provided");
		});

		it("should return 200 with customer details if a valid token is provided", async () => {
			// First, log in to obtain a valid token
			const loginRes = await request(app)
				.post("/v1/customerAuth/login")
				.send({ email: testEmail, password: testPassword });
			expect(loginRes.statusCode).toEqual(200);
			const token = loginRes.body.data.token;

			const res = await request(app)
				.get("/v1/customerAuth/me")
				.set("Authorization", `Bearer ${token}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.customer).toBeDefined();
			expect(res.body.data.customer.email).toEqual(testEmail);
		});
	});
});
