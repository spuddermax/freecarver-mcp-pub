// /api/tests/inventory.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("Inventory Routes", () => {
	let authToken;
	let authAdmin;
	let locationId; // For inventory locations
	let productId; // For seeding inventory products
	let inventoryProductId; // For inventory product record

	beforeAll(async () => {
		// Ensure admin role with id = 1 exists.
		await pool.query(`
      INSERT INTO admin_roles (id, role_name)
      VALUES (1, 'admin')
      ON CONFLICT (id) DO NOTHING
    `);

		// Create an admin user for authentication.
		const adminPassword = "password";
		const hashedAdminPassword = await bcrypt.hash(adminPassword, 10);
		const adminResult = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, 'Inventory', 'Tester', 1) RETURNING *`,
			["inventory_tester@example.com", hashedAdminPassword]
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

		// Seed a product to be used in inventory product records.
		const productResult = await pool.query(
			`INSERT INTO products (name, description, price)
       VALUES ('Inventory Test Product', 'For inventory tests', 49.99) RETURNING id`
		);
		productId = productResult.rows[0].id;
	});

	afterAll(async () => {
		// Clean up: remove the seeded admin user and product.
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			"inventory_tester@example.com",
		]);
		await pool.query("DELETE FROM products WHERE id = $1", [productId]);
		if (locationId) {
			await pool.query("DELETE FROM inventory_locations WHERE id = $1", [
				locationId,
			]);
		}
		if (inventoryProductId) {
			await pool.query("DELETE FROM inventory_products WHERE id = $1", [
				inventoryProductId,
			]);
		}
	});

	describe("Inventory Locations Endpoints", () => {
		it("should create a new inventory location", async () => {
			const res = await request(app)
				.post("/v1/inventory/locations")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					location_identifier: "LOC-001",
					description: "Test Location",
				});
			expect(res.statusCode).toEqual(201);
			expect(res.body.location).toBeDefined();
			expect(res.body.location.location_identifier).toEqual("LOC-001");
			locationId = res.body.location.id;
		});

		it("should retrieve a list of inventory locations", async () => {
			const res = await request(app)
				.get("/v1/inventory/locations")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.locations)).toBe(true);
			const loc = res.body.locations.find((l) => l.id === locationId);
			expect(loc).toBeDefined();
		});

		it("should retrieve details for a specific inventory location", async () => {
			const res = await request(app)
				.get(`/v1/inventory/locations/${locationId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.location).toBeDefined();
			expect(res.body.location.id).toEqual(locationId);
		});

		it("should update an inventory location", async () => {
			const res = await request(app)
				.put(`/v1/inventory/locations/${locationId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					location_identifier: "LOC-002",
					description: "Updated Location",
				});
			expect(res.statusCode).toEqual(200);
			expect(res.body.location).toBeDefined();
			expect(res.body.location.location_identifier).toEqual("LOC-002");
		});

		it("should delete an inventory location", async () => {
			// Create a temporary location to delete.
			const tempRes = await request(app)
				.post("/v1/inventory/locations")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					location_identifier: "TEMP-LOC",
					description: "Temporary Location",
				});
			const tempLocationId = tempRes.body.location.id;
			const res = await request(app)
				.delete(`/v1/inventory/locations/${tempLocationId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual(
				"Inventory location deleted successfully."
			);
			// Verify deletion.
			const getRes = await request(app)
				.get(`/v1/inventory/locations/${tempLocationId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});

	describe("Inventory Products Endpoints", () => {
		it("should create or update an inventory product record", async () => {
			const res = await request(app)
				.post("/v1/inventory/products")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					product_id: productId,
					location_id: locationId,
					quantity: 100,
				});
			expect(res.statusCode).toEqual(201);
			expect(res.body.product).toBeDefined();
			expect(res.body.product.product_id).toEqual(productId);
			expect(res.body.product.location_id).toEqual(locationId);
			inventoryProductId = res.body.product.id;
		});

		it("should retrieve a list of inventory product records", async () => {
			const res = await request(app)
				.get("/v1/inventory/products")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.products)).toBe(true);
			const record = res.body.products.find(
				(p) => p.id === inventoryProductId
			);
			expect(record).toBeDefined();
		});

		it("should retrieve details for a specific inventory product record", async () => {
			const res = await request(app)
				.get(`/v1/inventory/products/${inventoryProductId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.product).toBeDefined();
			expect(res.body.product.id).toEqual(inventoryProductId);
		});

		it("should update an inventory product record", async () => {
			const res = await request(app)
				.put(`/v1/inventory/products/${inventoryProductId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					product_id: productId,
					location_id: locationId,
					quantity: 150,
				});
			expect(res.statusCode).toEqual(200);
			expect(res.body.product).toBeDefined();
			expect(res.body.product.quantity).toEqual(150);
		});

		it("should delete an inventory product record", async () => {
			// Create a temporary inventory product record to delete.
			const tempRes = await request(app)
				.post("/v1/inventory/products")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					product_id: productId,
					location_id: locationId,
					quantity: 50,
				});
			const tempProductId = tempRes.body.product.id;
			const res = await request(app)
				.delete(`/v1/inventory/products/${tempProductId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual(
				"Inventory product record deleted successfully."
			);
			// Verify deletion.
			const getRes = await request(app)
				.get(`/v1/inventory/products/${tempProductId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});
});
