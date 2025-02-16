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
		await pool.end();
	});

	describe("GET /v1/products", () => {
		it("should retrieve a list of products with total count", async () => {
			const res = await request(app)
				.get("/v1/products")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data).toHaveProperty("total");
			expect(res.body.data).toHaveProperty("products");
		});

		it("should return a validation error for an invalid query parameter", async () => {
			// "page" must be a number
			const res = await request(app)
				.get("/v1/products?page=abc")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(422);
			expect(res.body.errors).toBeDefined();
			expect(Array.isArray(res.body.errors)).toBe(true);
			const hasPageError = res.body.errors.some(
				(err) => err.field === "page"
			);
			expect(hasPageError).toBe(true);
		});
	});

	describe("POST /v1/products", () => {
		it("should create a new product", async () => {
			const newProduct = {
				name: "Test Product",
				description: "A great product",
				price: 19.99,
				sale_price: 14.99,
				sale_start: "2025-01-01T00:00:00Z",
				sale_end: "2025-01-10T00:00:00Z",
				product_media: JSON.stringify([
					{
						url: "http://example.com/image.png",
						title: "Example Image",
					},
				]),
			};

			const res = await request(app)
				.post("/v1/products")
				.set("Authorization", `Bearer ${authToken}`)
				.send(newProduct);
			// Successful creation returns 201 with the product data.
			expect(res.statusCode).toEqual(201);
			expect(res.body.data.product).toBeDefined();
			expect(res.body.data.product.name).toEqual("Test Product");
			productId = res.body.data.product.id;
		});

		it("should return a validation error when required fields are missing", async () => {
			const invalidProduct = {
				description: "Missing name and price fields",
			};
			const res = await request(app)
				.post("/v1/products")
				.set("Authorization", `Bearer ${authToken}`)
				.send(invalidProduct);
			expect(res.statusCode).toEqual(422);
			expect(res.body.errors).toBeDefined();
			expect(Array.isArray(res.body.errors)).toBe(true);
			const hasNameError = res.body.errors.some(
				(err) => err.field === "name"
			);
			const hasPriceError = res.body.errors.some(
				(err) => err.field === "price"
			);
			expect(hasNameError).toBe(true);
			expect(hasPriceError).toBe(true);
		});
	});

	describe("GET /v1/products/:id", () => {
		it("should retrieve an existing product", async () => {
			const res = await request(app)
				.get(`/v1/products/${productId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.product).toBeDefined();
			expect(res.body.data.product.id).toEqual(productId);
		});

		it("should return a validation error for a non-numeric product id", async () => {
			const res = await request(app)
				.get("/v1/products/invalid-id")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(422);
			expect(res.body.errors).toBeDefined();
			const hasIdError = res.body.errors.some(
				(err) => err.field === "id"
			);
			expect(hasIdError).toBe(true);
		});

		it("should return 404 for a non-existent product", async () => {
			const res = await request(app)
				.get("/v1/products/999999")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(404);
			expect(res.body.message).toEqual("Product not found.");
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
			expect(res.body.data.product).toBeDefined();
			expect(res.body.data.product.name).toEqual("Updated Product");
		});

		it("should return a validation error when updating with an invalid id", async () => {
			const updatedData = {
				name: "Invalid Update",
				description: "Invalid update",
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
				.put("/v1/products/invalid-id")
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedData);
			expect(res.statusCode).toEqual(422);
			expect(res.body.errors).toBeDefined();
			const hasIdError = res.body.errors.some(
				(err) => err.field === "id"
			);
			expect(hasIdError).toBe(true);
		});

		it("should return a validation error when updating with invalid payload", async () => {
			// Send a payload with an invalid data type for price (non-convertible string)
			const badData = {
				name: "Bad Product",
				description: "Bad description",
				price: "invalid", // invalid: not a convertible number
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
				.send(badData);
			expect(res.statusCode).toEqual(422);
			expect(res.body.errors).toBeDefined();
			const hasPriceError = res.body.errors.some(
				(err) => err.field === "price"
			);
			expect(hasPriceError).toBe(true);
		});
	});

	describe("DELETE /v1/products/:id", () => {
		it("should delete an existing product", async () => {
			const res = await request(app)
				.delete(`/v1/products/${productId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Product deleted successfully");

			// Confirm deletion by attempting to retrieve the deleted product.
			const getRes = await request(app)
				.get(`/v1/products/${productId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});

		it("should return a validation error when deleting with an invalid id", async () => {
			const res = await request(app)
				.delete("/v1/products/invalid-id")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(422);
			expect(res.body.errors).toBeDefined();
			const hasIdError = res.body.errors.some(
				(err) => err.field === "id"
			);
			expect(hasIdError).toBe(true);
		});
	});
});
