// /api/tests/products.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("Products Routes", () => {
	let authToken;
	let authAdmin; // Admin user used for authentication
	let productId; // Will hold the ID of the created product

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
       VALUES ($1, $2, 'Product', 'Tester', 1) RETURNING *`,
			["product_tester@example.com", hashedPassword]
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
		// Clean up: remove the test admin user
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			"product_tester@example.com",
		]);
		// Also remove the test product if it still exists.
		if (productId) {
			await pool.query("DELETE FROM products WHERE id = $1", [productId]);
		}
		// Note: The pool will be closed in the global teardown.
	});

	describe("GET /v1/products", () => {
		it("should retrieve a list of products", async () => {
			const res = await request(app)
				.get("/v1/products")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.products)).toBe(true);
		});
	});

	describe("POST /v1/products", () => {
		it("should create a new product", async () => {
			const productData = {
				name: "Test Product",
				description: "A product for testing",
				price: 19.99,
				sale_price: 14.99,
				sale_start: "2025-03-01T00:00:00Z",
				sale_end: "2025-03-10T00:00:00Z",
				product_media: JSON.stringify([
					{ url: "http://example.com/image.png", title: "Image" },
				]),
			};

			const res = await request(app)
				.post("/v1/products")
				.set("Authorization", `Bearer ${authToken}`)
				.send(productData);
			expect(res.statusCode).toEqual(201);
			expect(res.body.product).toBeDefined();
			expect(res.body.product.name).toEqual("Test Product");
			productId = res.body.product.id;
		});
	});

	describe("GET /v1/products/:id", () => {
		it("should retrieve product details", async () => {
			const res = await request(app)
				.get(`/v1/products/${productId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.product).toBeDefined();
			expect(res.body.product.id).toEqual(productId);
		});

		it("should return 404 for a non-existent product", async () => {
			const res = await request(app)
				.get("/v1/products/999999")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(404);
			expect(res.body.error).toEqual("Product not found.");
		});
	});

	describe("PUT /v1/products/:id", () => {
		it("should update an existing product", async () => {
			const updatedData = {
				name: "Updated Product",
				description: "Updated description",
				price: 29.99,
				sale_price: 24.99,
				sale_start: "2025-04-01T00:00:00Z",
				sale_end: "2025-04-10T00:00:00Z",
				product_media: JSON.stringify([
					{
						url: "http://example.com/newimage.png",
						title: "New Image",
					},
				]),
			};

			const res = await request(app)
				.put(`/v1/products/${productId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedData);
			expect(res.statusCode).toEqual(200);
			expect(res.body.product).toBeDefined();
			expect(res.body.product.name).toEqual("Updated Product");
		});
	});

	describe("DELETE /v1/products/:id", () => {
		it("should delete an existing product", async () => {
			const res = await request(app)
				.delete(`/v1/products/${productId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Product deleted successfully.");

			// Verify deletion
			const getRes = await request(app)
				.get(`/v1/products/${productId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});
});
