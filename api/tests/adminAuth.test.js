// /api/tests/adminAuth.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("AdminAuth Routes", () => {
	let testAdmin;

	beforeAll(async () => {
		// Create an admin role if needed, and an admin user for testing.
		// NOTE: Adjust the INSERT query below if your DB expects different fields.
		const hashedPassword = await bcrypt.hash("password", 10);
		const adminUserResult = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, 'Test', 'Admin', 1)
       RETURNING *;`,
			["testadmin@example.com", hashedPassword]
		);
		testAdmin = adminUserResult.rows[0];
	});

	afterAll(async () => {
		// Clean up inserted records.
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			"testadmin@example.com",
		]);
		await pool.end();
	});

	describe("POST /v1/adminAuth/login", () => {
		it("should login successfully and return a JWT token", async () => {
			const res = await request(app).post("/v1/adminAuth/login").send({
				email: "testadmin@example.com",
				password: "password",
			});
			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveProperty("token");
			expect(res.body.message).toEqual("Login successful");
		});

		it("should return 400 if email or password is missing", async () => {
			const res = await request(app).post("/v1/adminAuth/login").send({
				email: "testadmin@example.com",
			});
			expect(res.statusCode).toEqual(400);
			expect(res.body.message).toEqual(
				"Email and password are required."
			);
		});

		it("should return 401 for invalid credentials", async () => {
			const res = await request(app).post("/v1/adminAuth/login").send({
				email: "testadmin@example.com",
				password: "wrongpassword",
			});
			expect(res.statusCode).toEqual(401);
			expect(res.body.message).toEqual("Invalid credentials.");
		});
	});

	describe("GET /v1/adminAuth/me", () => {
		let token;

		beforeAll(async () => {
			// Acquire a token by logging in.
			const res = await request(app).post("/v1/adminAuth/login").send({
				email: "testadmin@example.com",
				password: "password",
			});
			token = res.body.data.token;
		});

		it("should retrieve admin details when provided with a valid JWT", async () => {
			const res = await request(app)
				.get("/v1/adminAuth/me")
				.set("Authorization", `Bearer ${token}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveProperty("admin");
			expect(res.body.data.admin.email).toEqual("testadmin@example.com");
			expect(res.body.message).toEqual("Admin details retrieved");
		});
	});

	describe("POST /v1/adminAuth/logout", () => {
		let token;

		beforeAll(async () => {
			const res = await request(app).post("/v1/adminAuth/login").send({
				email: "testadmin@example.com",
				password: "password",
			});
			token = res.body.data.token;
		});

		it("should logout successfully and return 200", async () => {
			const res = await request(app)
				.post("/v1/adminAuth/logout")
				.set("Authorization", `Bearer ${token}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Logout successful");
		});
	});
});
