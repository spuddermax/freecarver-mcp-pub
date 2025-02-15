// /api/tests/shipments.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("Shipments Routes", () => {
	let authToken;
	let authAdmin;
	let customerId;
	let orderId;
	let shipmentId;
	let shipmentItemId;
	let productId;
	let orderItemId;

	beforeAll(async () => {
		// Ensure admin role with id = 1 exists.
		await pool.query(`
      INSERT INTO admin_roles (id, role_name)
      VALUES (1, 'admin')
      ON CONFLICT (id) DO NOTHING
    `);

		// Create an admin user for authentication.
		const adminPassword = "password";
		const hashedAdmin = await bcrypt.hash(adminPassword, 10);
		const adminResult = await pool.query(
			`INSERT INTO admin_users (email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, 'Shipment', 'Tester', 1) RETURNING *`,
			["shipments_tester@example.com", hashedAdmin]
		);
		authAdmin = adminResult.rows[0];
		authToken = jwt.sign(
			{
				id: authAdmin.id,
				email: authAdmin.email,
				role_id: authAdmin.role_id,
			},
			process.env.JWT_SECRET,
			{ expiresIn: "1h" }
		);

		// Create a test customer for the order.
		const custPassword = "custpass";
		const hashedCust = await bcrypt.hash(custPassword, 10);
		const custResult = await pool.query(
			`INSERT INTO customers (email, password_hash, first_name, last_name, phone_number)
       VALUES ($1, $2, 'Order', 'Customer', '0000000000') RETURNING id`,
			["shipment_customer@example.com", hashedCust]
		);
		customerId = custResult.rows[0].id;

		// Create a dummy order.
		const orderResult = await pool.query(
			`INSERT INTO orders (customer_id, order_total)
       VALUES ($1, $2) RETURNING id`,
			[customerId, 100.0]
		);
		orderId = orderResult.rows[0].id;

		// Seed a test product (for order items).
		const productResult = await pool.query(
			`INSERT INTO products (name, description, price)
       VALUES ('Shipment Test Product', 'For shipments', 25.00) RETURNING id`
		);
		productId = productResult.rows[0].id;

		// Seed a dummy order item record (for shipment items).
		const orderItemResult = await pool.query(
			`INSERT INTO order_items (order_id, product_id, quantity, price)
       VALUES ($1, $2, $3, $4) RETURNING id`,
			[orderId, productId, 2, 25.0]
		);
		orderItemId = orderItemResult.rows[0].id;
	});

	afterAll(async () => {
		// Clean up: first delete any shipment items and shipments associated with the test order
		await pool.query(
			"DELETE FROM shipment_items WHERE shipment_id IN (SELECT id FROM shipments WHERE order_id = $1)",
			[orderId]
		);
		await pool.query("DELETE FROM shipments WHERE order_id = $1", [
			orderId,
		]);

		if (orderItemId) {
			await pool.query("DELETE FROM order_items WHERE id = $1", [
				orderItemId,
			]);
		}
		if (orderId) {
			await pool.query("DELETE FROM orders WHERE id = $1", [orderId]);
		}
		if (productId) {
			await pool.query("DELETE FROM products WHERE id = $1", [productId]);
		}
		await pool.query("DELETE FROM customers WHERE email = $1", [
			"shipment_customer@example.com",
		]);
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			"shipments_tester@example.com",
		]);
	});

	describe("Shipments Endpoints", () => {
		it("should create a new shipment", async () => {
			const payload = {
				order_id: orderId,
				shipment_date: "2025-08-01T00:00:00Z",
				tracking_number: "TRACK123",
				shipping_carrier: "CarrierX",
				status: "in transit",
			};
			const res = await request(app)
				.post("/v1/shipments")
				.set("Authorization", `Bearer ${authToken}`)
				.send(payload);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.shipment).toBeDefined();
			expect(res.body.data.shipment.order_id).toEqual(orderId);
			shipmentId = res.body.data.shipment.id;
		});

		it("should retrieve a list of shipments", async () => {
			const res = await request(app)
				.get("/v1/shipments")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.shipments)).toBe(true);
			const shipment = res.body.data.shipments.find(
				(s) => s.id === shipmentId
			);
			expect(shipment).toBeDefined();
		});

		it("should retrieve shipment details", async () => {
			const res = await request(app)
				.get(`/v1/shipments/${shipmentId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.shipment).toBeDefined();
			expect(res.body.data.shipment.id).toEqual(shipmentId);
		});

		it("should update an existing shipment", async () => {
			const updatedPayload = {
				order_id: orderId,
				shipment_date: "2025-08-05T00:00:00Z",
				tracking_number: "TRACK456",
				shipping_carrier: "CarrierY",
				status: "delivered",
			};
			const res = await request(app)
				.put(`/v1/shipments/${shipmentId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedPayload);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.shipment).toBeDefined();
			expect(res.body.data.shipment.tracking_number).toEqual("TRACK456");
		});

		it("should delete a shipment", async () => {
			// Create a temporary shipment to delete.
			const tempRes = await request(app)
				.post("/v1/shipments")
				.set("Authorization", `Bearer ${authToken}`)
				.send({
					order_id: orderId,
					shipment_date: "2025-09-01T00:00:00Z",
					tracking_number: "TEMPTRACK",
					shipping_carrier: "CarrierZ",
					status: "pending",
				});
			const tempShipmentId = tempRes.body.data.shipment.id;
			const res = await request(app)
				.delete(`/v1/shipments/${tempShipmentId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Shipment deleted successfully");
			// Verify deletion.
			const getRes = await request(app)
				.get(`/v1/shipments/${tempShipmentId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});

	describe("Shipment Items Endpoints", () => {
		it("should create a new shipment item", async () => {
			const payload = {
				order_item_id: orderItemId,
				quantity_shipped: 1,
			};
			const res = await request(app)
				.post(`/v1/shipments/${shipmentId}/items`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(payload);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.item).toBeDefined();
			expect(res.body.data.item.order_item_id).toEqual(orderItemId);
			shipmentItemId = res.body.data.item.id;
		});

		it("should retrieve all shipment items for the shipment", async () => {
			const res = await request(app)
				.get(`/v1/shipments/${shipmentId}/items`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.items)).toBe(true);
			const item = res.body.data.items.find(
				(i) => i.id === shipmentItemId
			);
			expect(item).toBeDefined();
		});

		it("should retrieve a specific shipment item", async () => {
			const res = await request(app)
				.get(`/v1/shipments/${shipmentId}/items/${shipmentItemId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.item).toBeDefined();
			expect(res.body.data.item.id).toEqual(shipmentItemId);
		});

		it("should update an existing shipment item", async () => {
			const updatedPayload = {
				order_item_id: orderItemId,
				quantity_shipped: 2,
			};
			const res = await request(app)
				.put(`/v1/shipments/${shipmentId}/items/${shipmentItemId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedPayload);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.item).toBeDefined();
			expect(res.body.data.item.quantity_shipped).toEqual(2);
		});

		it("should delete a shipment item", async () => {
			const res = await request(app)
				.delete(`/v1/shipments/${shipmentId}/items/${shipmentItemId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual(
				"Shipment item deleted successfully"
			);
			// Verify deletion.
			const getRes = await request(app)
				.get(`/v1/shipments/${shipmentId}/items/${shipmentItemId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});
});
