// /api/tests/productCategories.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("Product Categories Routes", () => {
	let authToken;
	let authAdmin;
	let categoryId; // Will store the ID of the created product category

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
		const adminResult = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, 'Category', 'Tester', 1) RETURNING *`,
			["category_tester@example.com", hashedPassword]
		);
		authAdmin = adminResult.rows[0];

		// Generate a JWT token for the admin user
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

	afterAll(async () => {
		// Clean up the test admin user
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			"category_tester@example.com",
		]);
		// Clean up the test product category (if it exists)
		if (categoryId) {
			await pool.query("DELETE FROM product_categories WHERE id = $1", [
				categoryId,
			]);
		}
		// Note: global teardown will close the pool.
	});

	describe("POST /v1/product_categories", () => {
		it("should create a new product category", async () => {
			const payload = {
				name: "Test Category",
				description: "A category for testing purposes",
				// Optionally, you can include parent_category_id if needed
			};
			const res = await request(app)
				.post("/v1/product_categories")
				.set("Authorization", `Bearer ${authToken}`)
				.send(payload);
			// Successful creation now returns status 201.
			expect(res.statusCode).toEqual(201);
			expect(res.body.data.category).toBeDefined();
			expect(res.body.data.category.name).toEqual("Test Category");
			categoryId = res.body.data.category.id;
		});

		it("should return 422 if 'name' is missing", async () => {
			const res = await request(app)
				.post("/v1/product_categories")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ description: "Missing name field" });
			// Validation errors now return 422.
			expect(res.statusCode).toEqual(422);
			// The validation middleware returns "Validation failed" as the message.
			expect(res.body.message).toEqual("Validation failed");
		});
	});

	describe("GET /v1/product_categories", () => {
		it("should retrieve a list of product categories", async () => {
			const res = await request(app)
				.get("/v1/product_categories")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.categories)).toBe(true);
			const category = res.body.data.categories.find(
				(cat) => cat.id === categoryId
			);
			expect(category).toBeDefined();
		});
	});

	describe("GET /v1/product_categories/:id", () => {
		it("should retrieve details for a specific product category", async () => {
			const res = await request(app)
				.get(`/v1/product_categories/${categoryId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.category).toBeDefined();
			expect(res.body.data.category.id).toEqual(categoryId);
		});

		it("should return 404 for a non-existent category", async () => {
			const res = await request(app)
				.get("/v1/product_categories/999999")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(404);
			expect(res.body.message).toEqual("Product category not found.");
		});
	});

	describe("PUT /v1/product_categories/:id", () => {
		it("should update an existing product category", async () => {
			const updatedPayload = {
				name: "Updated Category",
				description: "Updated description",
				parent_category_id: null, // or a valid parent id if needed
			};
			const res = await request(app)
				.put(`/v1/product_categories/${categoryId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedPayload);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.category).toBeDefined();
			expect(res.body.data.category.name).toEqual("Updated Category");
		});

		it("should return 422 if 'name' is missing during update", async () => {
			const res = await request(app)
				.put(`/v1/product_categories/${categoryId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ description: "No name provided" });
			// Validation error returns a 422 status.
			expect(res.statusCode).toEqual(422);
			expect(res.body.message).toEqual("Validation failed");
		});
	});

	describe("DELETE /v1/product_categories/:id", () => {
		it("should delete an existing product category", async () => {
			const res = await request(app)
				.delete(`/v1/product_categories/${categoryId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual(
				"Product category deleted successfully"
			);

			// Verify deletion by attempting to fetch it.
			const getRes = await request(app)
				.get(`/v1/product_categories/${categoryId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});
});
