// /api/tests/customers.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("Customers Routes", () => {
	let authToken;
	let authAdmin;
	let customerId; // To store the ID of the created customer

	beforeAll(async () => {
		// Ensure an admin role with id = 1 exists.
		await pool.query(`
      INSERT INTO admin_roles (id, role_name)
      VALUES (1, 'admin')
      ON CONFLICT (id) DO NOTHING
    `);

		// Create an admin user for authentication.
		const adminPassword = "password";
		const hashedPassword = await bcrypt.hash(adminPassword, 10);
		const adminResult = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, 'Customer', 'Tester', 1) RETURNING *`,
			["customer_tester@example.com", hashedPassword]
		);
		authAdmin = adminResult.rows[0];

		// Generate a JWT token for the admin user.
		authToken = jwt.sign(
			{
				id: authAdmin.id,
				email: authAdmin.email,
				role_id: authAdmin.role_id,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);

		// Create a test customer using the POST endpoint.
		const res = await request(app)
			.post("/v1/customers")
			.set("Authorization", `Bearer ${authToken}`)
			.send({
				email: "testcustomer@example.com",
				password: "Test1234", // meets the min length requirement
				first_name: "Test",
				last_name: "Customer",
				phone_number: "1234567890",
			});
		expect(res.statusCode).toEqual(201);
		customerId = res.body.data.customer.id;
	});

	afterAll(async () => {
		// Clean up: delete the test admin user.
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			"customer_tester@example.com",
		]);
		// If a customer was created, delete it (if not already deleted by the DELETE test).
		if (customerId) {
			await pool.query("DELETE FROM customers WHERE id = $1", [
				customerId,
			]);
		}
	});

	describe("POST /v1/customers", () => {
		it("should create a new customer", async () => {
			const payload = {
				email: "newcustomer@example.com",
				password: "newpass123",
				first_name: "New",
				last_name: "Customer",
				phone_number: "0987654321",
			};
			const res = await request(app)
				.post("/v1/customers")
				.set("Authorization", `Bearer ${authToken}`)
				.send(payload);
			expect(res.statusCode).toEqual(201);
			expect(res.body.data.customer).toBeDefined();
			expect(res.body.data.customer.email).toEqual(
				"newcustomer@example.com"
			);
			// Save customerId in case we need it later.
			customerId = res.body.data.customer.id;
		});

		it("should return 422 if email or password is missing", async () => {
			const res = await request(app)
				.post("/v1/customers")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ email: "incomplete@example.com" }); // Missing password.
			expect(res.statusCode).toEqual(422);
			expect(res.body.message.toLowerCase()).toContain(
				"validation failed"
			);
		});
	});

	describe("GET /v1/customers", () => {
		it("should retrieve a list of customers", async () => {
			const res = await request(app)
				.get("/v1/customers")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.customers)).toBe(true);
			const customer = res.body.data.customers.find(
				(c) => c.id === customerId
			);
			expect(customer).toBeDefined();
		});
	});

	describe("GET /v1/customers/:id", () => {
		it("should retrieve details for a specific customer", async () => {
			const res = await request(app)
				.get(`/v1/customers/${customerId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.customer).toBeDefined();
			expect(res.body.data.customer.id).toEqual(customerId);
		});

		it("should return 404 for a non-existent customer", async () => {
			const res = await request(app)
				.get("/v1/customers/999999")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(404);
			expect(res.body.message).toEqual("Customer not found.");
		});
	});

	describe("PUT /v1/customers/:id", () => {
		it("should update a customer successfully with a valid payload", async () => {
			const updatedPayload = {
				email: "updatedcustomer@example.com",
				first_name: "Updated",
				last_name: "Customer",
				phone_number: "0987654321",
			};
			const res = await request(app)
				.put(`/v1/customers/${customerId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedPayload);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.customer).toBeDefined();
			expect(res.body.data.customer.email).toEqual(
				"updatedcustomer@example.com"
			);
		});

		it("should return 422 if email is missing during update", async () => {
			const res = await request(app)
				.put(`/v1/customers/${customerId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ first_name: "NoEmail" }); // Email is required, so validation should fail.
			expect(res.statusCode).toEqual(422);
			expect(res.body.message.toLowerCase()).toContain(
				"validation failed"
			);
		});
	});

	describe("DELETE /v1/customers/:id", () => {
		it("should delete an existing customer", async () => {
			const res = await request(app)
				.delete(`/v1/customers/${customerId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Customer deleted successfully");
			// Verify deletion by attempting to fetch the deleted customer.
			const getRes = await request(app)
				.get(`/v1/customers/${customerId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});
});
