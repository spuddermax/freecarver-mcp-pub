// /api/tests/orders.test.js

import request from "supertest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import app from "../app.js";
import { pool } from "../db.js";

dotenv.config();

describe("Orders Routes", () => {
	let authToken;
	let authAdmin;
	let customerId;
	let productId;
	let orderId;
	let orderItemId;

	beforeAll(async () => {
		// Ensure an admin role with id = 1 exists.
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
       VALUES ($1, $2, 'Order', 'Tester', 1) RETURNING *`,
			["orders_tester@example.com", hashedAdminPassword]
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

		// Create a test customer for orders.
		const customerPassword = "custpass";
		const hashedCustPassword = await bcrypt.hash(customerPassword, 10);
		const customerResult = await pool.query(
			`INSERT INTO customers (email, password_hash, first_name, last_name, phone_number)
       VALUES ($1, $2, 'Test', 'Customer', '1234567890') RETURNING id`,
			["order_customer@example.com", hashedCustPassword]
		);
		customerId = customerResult.rows[0].id;

		// Create a test product for order items.
		const productResult = await pool.query(
			`INSERT INTO products (name, description, price)
       VALUES ('Order Test Product', 'Product for order tests', 19.99) RETURNING id`
		);
		productId = productResult.rows[0].id;
	});

	afterAll(async () => {
		// Clean up order items and orders if they still exist.
		if (orderId) {
			await pool.query("DELETE FROM order_items WHERE order_id = $1", [
				orderId,
			]);
			await pool.query("DELETE FROM orders WHERE id = $1", [orderId]);
		}
		// Remove test product.
		await pool.query("DELETE FROM products WHERE id = $1", [productId]);
		// Remove test customer.
		await pool.query("DELETE FROM customers WHERE id = $1", [customerId]);
		// Remove test admin user.
		await pool.query("DELETE FROM admin_users WHERE email = $1", [
			"orders_tester@example.com",
		]);
	});

	describe("Orders Endpoints", () => {
		it("should create a new order", async () => {
			const payload = {
				customer_id: customerId,
				status: "pending",
				order_total: 100.0,
				refund_total: null,
				refund_date: null,
				refund_status: "none",
				refund_reason: null,
			};
			const res = await request(app)
				.post("/v1/orders")
				.set("Authorization", `Bearer ${authToken}`)
				.send(payload);
			expect(res.statusCode).toEqual(201);
			expect(res.body.order).toBeDefined();
			expect(res.body.order.customer_id).toEqual(customerId);
			orderId = res.body.order.id;
		});

		it("should retrieve a list of orders", async () => {
			const res = await request(app)
				.get("/v1/orders")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.orders)).toBe(true);
			const order = res.body.orders.find((o) => o.id === orderId);
			expect(order).toBeDefined();
		});

		it("should retrieve order details", async () => {
			const res = await request(app)
				.get(`/v1/orders/${orderId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.order).toBeDefined();
			expect(res.body.order.id).toEqual(orderId);
		});

		it("should update an existing order", async () => {
			const updatedPayload = {
				customer_id: customerId,
				status: "completed",
				order_total: 120.0,
				refund_total: 10.0,
				refund_date: "2025-07-01T00:00:00Z",
				refund_status: "approved",
				refund_reason: "Product issue",
			};
			const res = await request(app)
				.put(`/v1/orders/${orderId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedPayload);
			expect(res.statusCode).toEqual(200);
			expect(res.body.order).toBeDefined();
			expect(res.body.order.status).toEqual("completed");
		});
	});

	describe("Order Items Endpoints", () => {
		it("should create a new order item", async () => {
			const payload = {
				product_id: productId,
				quantity: 2,
				price: 19.99,
			};
			const res = await request(app)
				.post(`/v1/orders/${orderId}/items`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(payload);
			expect(res.statusCode).toEqual(201);
			expect(res.body.item).toBeDefined();
			expect(res.body.item.product_id).toEqual(productId);
			orderItemId = res.body.item.id;
		});

		it("should retrieve all order items for the order", async () => {
			const res = await request(app)
				.get(`/v1/orders/${orderId}/items`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.items)).toBe(true);
			const item = res.body.items.find((i) => i.id === orderItemId);
			expect(item).toBeDefined();
		});

		it("should retrieve a specific order item", async () => {
			const res = await request(app)
				.get(`/v1/orders/${orderId}/items/${orderItemId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.item).toBeDefined();
			expect(res.body.item.id).toEqual(orderItemId);
		});

		it("should update an existing order item", async () => {
			const updatedPayload = {
				product_id: productId,
				quantity: 3,
				price: 17.99,
			};
			const res = await request(app)
				.put(`/v1/orders/${orderId}/items/${orderItemId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send(updatedPayload);
			expect(res.statusCode).toEqual(200);
			expect(res.body.item).toBeDefined();
			expect(res.body.item.quantity).toEqual(3);
		});

		it("should delete an order item", async () => {
			const res = await request(app)
				.delete(`/v1/orders/${orderId}/items/${orderItemId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual(
				"Order item deleted successfully."
			);

			// Verify deletion.
			const getRes = await request(app)
				.get(`/v1/orders/${orderId}/items/${orderItemId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});

	describe("DELETE /v1/orders/:id", () => {
		it("should delete an order", async () => {
			const res = await request(app)
				.delete(`/v1/orders/${orderId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Order deleted successfully.");

			// Verify deletion.
			const getRes = await request(app)
				.get(`/v1/orders/${orderId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});
});
