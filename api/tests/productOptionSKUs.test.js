// /api/tests/productOptionSKUs.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("Product Option SKUs Routes", () => {
	let authToken;
	let authAdmin;
	let productId;
	let optionId;
	let variantId;
	let skuId; // to store the SKU association id

	beforeAll(async () => {
		// Ensure admin role with id = 1 exists
		await pool.query(`
			INSERT INTO admin_roles (id, role_name)
			VALUES (1, 'admin')
			ON CONFLICT (id) DO NOTHING
		`);

		// Create an admin user for authentication
		const adminPassword = "password";
		const hashedPassword = await bcrypt.hash(adminPassword, 10);
		const adminResult = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
			 VALUES ($1, $2, 'SKU', 'Tester', 1) RETURNING *`,
			["sku_tester@example.com", hashedPassword]
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

		// Seed a product for the SKU association
		const productResult = await pool.query(
			`INSERT INTO products (name, description, price)
			 VALUES ('Test Product', 'Product for SKU tests', 9.99) RETURNING id`
		);
		productId = productResult.rows[0].id;

		// Seed a product option
		const optionResult = await pool.query(
			`INSERT INTO product_options (option_name)
			 VALUES ('Color') RETURNING id`
		);
		optionId = optionResult.rows[0].id;

		// Seed a product option variant for the product option
		const variantResult = await pool.query(
			`INSERT INTO product_option_variants (option_id, option_value)
			 VALUES ($1, 'Red') RETURNING id`,
			[optionId]
		);
		variantId = variantResult.rows[0].id;
	});

	afterAll(async () => {
		// Cleanup: Remove the seeded SKU association (if still exists)
		if (skuId) {
			await pool.query("DELETE FROM product_option_skus WHERE id = $1", [
				skuId,
			]);
		}
		// Remove seeded product option variant, product option, product, and admin user
		await pool.query("DELETE FROM product_option_variants WHERE id = $1", [
			variantId,
		]);
		await pool.query("DELETE FROM product_options WHERE id = $1", [
			optionId,
		]);
		await pool.query("DELETE FROM products WHERE id = $1", [productId]);
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			"sku_tester@example.com",
		]);
	});

	describe("POST /v1/product_option_skus", () => {
		it("should create a new product option SKU association", async () => {
			const payload = {
				product_id: productId,
				option_id: optionId,
				variant_id: variantId,
				sku: "SKU12345",
				price: 12.99,
				sale_price: 10.99,
				sale_start: "2025-05-01T00:00:00Z",
				sale_end: "2025-05-10T00:00:00Z",
			};
			const res = await request(app)
				.post("/v1/product_option_skus")
				.set("Authorization", `Bearer ${authToken}`)
				.send(payload);
			// Updated status code to 201 (Created)
			expect(res.statusCode).toEqual(201);
			// Verify the SKU is wrapped in the data property.
			expect(res.body.data.sku).toBeDefined();
			expect(res.body.data.sku.sku).toEqual("SKU12345");
			skuId = res.body.data.sku.id;
		});

		it("should return 422 if required fields are missing", async () => {
			const res = await request(app)
				.post("/v1/product_option_skus")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ product_id: productId }); // missing option_id, variant_id, sku, etc.
			// Updated expected status code for validation error: 422
			expect(res.statusCode).toEqual(422);
			// Check error response using the message property.
			expect(res.body.message).toBeDefined();
		});
	});

	describe("GET /v1/product_option_skus", () => {
		it("should retrieve a list of product option SKUs", async () => {
			const res = await request(app)
				.get("/v1/product_option_skus")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			// Expect an array of SKUs within the data property.
			expect(Array.isArray(res.body.data.skus)).toBe(true);
			const skuEntry = res.body.data.skus.find((sku) => sku.id === skuId);
			expect(skuEntry).toBeDefined();
		});
	});

	describe("GET /v1/product_option_skus/:id", () => {
		it("should retrieve a specific product option SKU", async () => {
			const res = await request(app)
				.get(`/v1/product_option_skus/${skuId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			// Verify SKU is returned inside the data property.
			expect(res.body.data.sku).toBeDefined();
			expect(res.body.data.sku.id).toEqual(skuId);
		});

		it("should return 404 for non-existent SKU", async () => {
			const res = await request(app)
				.get("/v1/product_option_skus/999999")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(404);
			// Check error response using the message property.
			expect(res.body.message).toEqual("Product option SKU not found.");
		});
	});

	describe("PUT /v1/product_option_skus/:id", () => {
		it("should update an existing product option SKU", async () => {
			const updatedPayload = {
				product_id: productId,
				option_id: optionId,
				variant_id: variantId,
				sku: "SKU67890",
				price: 15.99,
				sale_price: 13.99,
				sale_start: "2025-06-01T00:00:00Z",
				sale_end: "2025-06-10T00:00:00Z",
			};
			const res = await request(app)
				.put(`/v1/product_option_skus/${skuId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedPayload);
			expect(res.statusCode).toEqual(200);
			// Verify updated SKU is returned within the data property.
			expect(res.body.data.sku).toBeDefined();
			expect(res.body.data.sku.sku).toEqual("SKU67890");
		});

		it("should return 422 if required fields are missing when updating", async () => {
			const res = await request(app)
				.put(`/v1/product_option_skus/${skuId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ sku: "Incomplete" });
			// Updated expected status code for validation error: 422
			expect(res.statusCode).toEqual(422);
			expect(res.body.message).toBeDefined();
		});
	});

	describe("DELETE /v1/product_option_skus/:id", () => {
		it("should delete an existing product option SKU", async () => {
			const res = await request(app)
				.delete(`/v1/product_option_skus/${skuId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			// Verify the delete response message.
			expect(res.body.message).toEqual(
				"Product option SKU deleted successfully"
			);
			// Confirm deletion by trying to fetch the SKU.
			const getRes = await request(app)
				.get(`/v1/product_option_skus/${skuId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});
});
