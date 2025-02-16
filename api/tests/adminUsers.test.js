// /api/tests/adminUsers.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("Admin Users Routes", () => {
	let authToken; // JWT for authenticated requests
	let authAdmin; // The admin user used for authentication
	let newAdminId; // Will store the ID of a newly created admin user

	// Seed an admin role and an auth admin user before tests run.
	beforeAll(async () => {
		// Ensure an admin role with id = 1 exists
		await pool.query(
			`INSERT INTO admin_roles (id, role_name)
       VALUES (1, 'admin')
       ON CONFLICT (id) DO NOTHING`
		);
		// Insert a test admin user for authentication
		const password = "password";
		const hashedPassword = await bcrypt.hash(password, 10);
		const result = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, 'Auth', 'User', 1) RETURNING *`,
			["admin_auth@example.com", hashedPassword]
		);
		authAdmin = result.rows[0];

		// Generate a JWT token for the auth admin user
		authToken = jwt.sign(
			{
				id: authAdmin.id,
				email: authAdmin.email,
				role_id: authAdmin.role_id,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);
	});

	// Clean up test admin users after tests complete.
	afterAll(async () => {
		await pool.query(
			"DELETE FROM admin_users WHERE email IN ($1, $2, $3)",
			[
				"admin_auth@example.com",
				"newadmin@example.com",
				"updatedadmin@example.com",
			]
		);
		// Global teardown will handle closing the pool.
	});

	describe("GET /v1/adminUsers", () => {
		it("should retrieve a list of admin users", async () => {
			const res = await request(app)
				.get("/v1/adminUsers")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.admins)).toBe(true);
		});
	});

	describe("POST /v1/adminUsers", () => {
		it("should create a new admin user", async () => {
			const res = await request(app)
				.post("/v1/adminUsers")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					email: "newadmin@example.com",
					password: "newpassword",
					first_name: "New",
					last_name: "Admin",
					phone_number: "555-1234",
					role_id: 1, // Ensure foreign key constraint is satisfied
					timezone: "UTC",
					mfa_enabled: false,
					mfa_method: null,
				});
			expect(res.statusCode).toEqual(201);
			expect(res.body.data.admin).toBeDefined();
			expect(res.body.data.admin.email).toEqual("newadmin@example.com");
			newAdminId = res.body.data.admin.id; // Save the ID for subsequent tests
		});

		it("should return 422 if required fields are missing when creating an admin user", async () => {
			// Omit the password field to trigger the required-field validation.
			const res = await request(app)
				.post("/v1/adminUsers")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					email: "invalidadmin@example.com",
					first_name: "Fail",
					last_name: "Admin",
					phone_number: "555-1111",
					role_id: 1,
					timezone: "UTC",
					mfa_enabled: true,
					mfa_method: "sms",
				});
			expect(res.statusCode).toEqual(422);
			// Optionally, if your validation middleware returns error details, you could check them:
			// expect(res.body.error).toContain("password");
		});
	});

	describe("GET /v1/adminUsers/:id", () => {
		it("should retrieve details of a specific admin user", async () => {
			const res = await request(app)
				.get(`/v1/adminUsers/${newAdminId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.admin).toBeDefined();
			expect(res.body.data.admin.id).toEqual(newAdminId);
		});

		it("should return 404 for a non-existent admin user", async () => {
			const res = await request(app)
				.get("/v1/adminUsers/999999")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(404);
			expect(res.body.message).toEqual("Admin user not found.");
		});
	});

	describe("POST /v1/adminUsers/:id/validatePassword", () => {
		it("should validate the password for an existing admin user with correct password", async () => {
			// Using the auth admin user created in beforeAll with password "password"
			const res = await request(app)
				.post(`/v1/adminUsers/${authAdmin.id}/validatePassword`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ password: "password" });
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Valid password.");
		});

		it("should fail to validate the password for an existing admin user with an incorrect password", async () => {
			const res = await request(app)
				.post(`/v1/adminUsers/${authAdmin.id}/validatePassword`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ password: "wrongpassword" });
			expect(res.statusCode).toEqual(401);
			expect(res.body.message).toEqual("Invalid password.");
		});

		it("should return 401 when validating password for a non-existent admin user", async () => {
			const res = await request(app)
				.post(`/v1/adminUsers/999999/validatePassword`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ password: "password" });
			expect(res.statusCode).toEqual(401);
			expect(res.body.message).toEqual("Invalid user.");
		});
	});

	describe("PUT /v1/adminUsers/:id", () => {
		it("should update an existing admin user's details", async () => {
			const res = await request(app)
				.put(`/v1/adminUsers/${newAdminId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					email: "updatedadmin@example.com",
					first_name: "Updated",
					last_name: "Admin",
					phone_number: "555-4321",
					timezone: "UTC",
					mfa_enabled: true,
					mfa_method: "sms",
				});
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.admin).toBeDefined();
			expect(res.body.data.admin.email).toEqual(
				"updatedadmin@example.com"
			);
		});

		it("should update admin user password if provided", async () => {
			const res = await request(app)
				.put(`/v1/adminUsers/${authAdmin.id}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					password: "newsecurepassword",
					email: authAdmin.email,
					first_name: "Auth",
					last_name: "User",
					phone_number: authAdmin.phone_number,
					timezone: "UTC",
					mfa_enabled: false,
					mfa_method: null,
				});
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.admin).toBeDefined();
		});
	});

	describe("DELETE /v1/adminUsers/:id", () => {
		it("should delete an admin user", async () => {
			const res = await request(app)
				.delete(`/v1/adminUsers/${newAdminId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Admin user deleted successfully");

			// Verify deletion: GET should return 404 for the deleted user.
			const getRes = await request(app)
				.get(`/v1/adminUsers/${newAdminId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});
});
