// /api/tests/productOptions.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("Product Options Routes", () => {
	let authToken; // JWT token for authenticated requests
	let authAdmin; // Admin user used for authentication
	let optionId; // Will store the ID of the created product option
	let variantId; // Will store the ID of the created variant

	beforeAll(async () => {
		// Ensure an admin role with id = 1 exists.
		await pool.query(`
      INSERT INTO admin_roles (id, role_name)
      VALUES (1, 'admin')
      ON CONFLICT (id) DO NOTHING
    `);

		// Create an admin user for authentication.
		const password = "password";
		const hashedPassword = await bcrypt.hash(password, 10);
		const adminResult = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, 'Option', 'Tester', 1) RETURNING *`,
			["option_tester@example.com", hashedPassword]
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
	});

	afterAll(async () => {
		// Clean up the admin user.
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			"option_tester@example.com",
		]);
		// Clean up the product option if it still exists.
		if (optionId) {
			await pool.query("DELETE FROM product_options WHERE id = $1", [
				optionId,
			]);
		}
	});

	describe("Product Options Endpoints", () => {
		it("should create a new product option", async () => {
			const res = await request(app)
				.post("/v1/product_options")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ option_name: "Color" });
			expect(res.statusCode).toEqual(201);
			expect(res.body.data.option).toBeDefined();
			expect(res.body.data.option.option_name).toEqual("Color");
			optionId = res.body.data.option.id;
		});

		it("should return 422 if required field is missing when creating a product option", async () => {
			const res = await request(app)
				.post("/v1/product_options")
				.set("Authorization", `Bearer ${authToken}`)
				.send({}); // Missing option_name
			expect(res.statusCode).toEqual(422);
			expect(res.body.message).toBeDefined();
		});

		it("should retrieve a list of product options", async () => {
			const res = await request(app)
				.get("/v1/product_options")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.options)).toBe(true);
			const option = res.body.data.options.find((o) => o.id === optionId);
			expect(option).toBeDefined();
		});

		it("should retrieve details for a specific product option", async () => {
			const res = await request(app)
				.get(`/v1/product_options/${optionId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.option).toBeDefined();
			expect(res.body.data.option.option_name).toEqual("Color");
		});

		it("should update an existing product option", async () => {
			const res = await request(app)
				.put(`/v1/product_options/${optionId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ option_name: "Shade" });
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.option).toBeDefined();
			expect(res.body.data.option.option_name).toEqual("Shade");
		});

		it("should return 422 if required field is missing when updating a product option", async () => {
			const res = await request(app)
				.put(`/v1/product_options/${optionId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({}); // Missing option_name
			expect(res.statusCode).toEqual(422);
			expect(res.body.message).toBeDefined();
		});
	});

	describe("Product Option Variants Endpoints", () => {
		it("should create a new variant for the product option", async () => {
			const res = await request(app)
				.post(`/v1/product_options/${optionId}/variants`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ option_value: "Red" });
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.variant).toBeDefined();
			expect(res.body.data.variant.option_value).toEqual("Red");
			variantId = res.body.data.variant.id;
		});

		it("should retrieve all variants for the product option", async () => {
			const res = await request(app)
				.get(`/v1/product_options/${optionId}/variants`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.variants)).toBe(true);
			const variant = res.body.data.variants.find(
				(v) => v.id === variantId
			);
			expect(variant).toBeDefined();
		});

		it("should retrieve a specific variant for the product option", async () => {
			const res = await request(app)
				.get(`/v1/product_options/${optionId}/variants/${variantId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.variant).toBeDefined();
			expect(res.body.data.variant.option_value).toEqual("Red");
		});

		it("should update an existing variant for the product option", async () => {
			const res = await request(app)
				.put(`/v1/product_options/${optionId}/variants/${variantId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ option_value: "Blue" });
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.variant).toBeDefined();
			expect(res.body.data.variant.option_value).toEqual("Blue");
		});

		it("should delete a variant for the product option", async () => {
			const res = await request(app)
				.delete(`/v1/product_options/${optionId}/variants/${variantId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Variant deleted successfully");
			// Verify deletion: attempt to retrieve the deleted variant.
			const getRes = await request(app)
				.get(`/v1/product_options/${optionId}/variants/${variantId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});

	describe("Cleanup", () => {
		it("should delete the product option", async () => {
			const res = await request(app)
				.delete(`/v1/product_options/${optionId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual(
				"Product option deleted successfully"
			);
		});
	});
});
