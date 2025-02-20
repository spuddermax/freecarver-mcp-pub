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
			`INSERT INTO products (name, sku, description, price)
       VALUES ('Order Test Product', 'ORD-TEST-SKU', 'Product for order tests', 19.99) RETURNING id`
		);
		productId = productResult.rows[0].id;
	});

	afterAll(async () => {
		// Clean up any order items and orders (if they still exist).
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
			expect(res.body.data.order).toBeDefined();
			expect(res.body.data.order.customer_id).toEqual(customerId);
			orderId = res.body.data.order.id;
		});

		it("should return 422 if required fields are missing when creating an order", async () => {
			const res = await request(app)
				.post("/v1/orders")
				.set("Authorization", `Bearer ${authToken}`)
				.send({ status: "pending" }); // Missing customer_id and order_total
			expect(res.statusCode).toEqual(422);
			expect(res.body.message).toBeDefined();
		});

		it("should retrieve a list of orders", async () => {
			const res = await request(app)
				.get("/v1/orders")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.orders)).toBe(true);
			const order = res.body.data.orders.find((o) => o.id === orderId);
			expect(order).toBeDefined();
		});

		it("should retrieve order details", async () => {
			const res = await request(app)
				.get(`/v1/orders/${orderId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.order).toBeDefined();
			expect(res.body.data.order.id).toEqual(orderId);
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
			expect(res.body.data.order).toBeDefined();
			expect(res.body.data.order.status).toEqual("completed");
		});

		it("should return 422 if required fields are missing when updating an order", async () => {
			const res = await request(app)
				.put(`/v1/orders/${orderId}`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ status: "completed" }); // Missing customer_id and order_total
			expect(res.statusCode).toEqual(422);
			expect(res.body.message).toBeDefined();
		});

		it("should delete an order", async () => {
			const res = await request(app)
				.delete(`/v1/orders/${orderId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Order deleted successfully");
			// Verify deletion by attempting to fetch the deleted order.
			const getRes = await request(app)
				.get(`/v1/orders/${orderId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});

	describe("Order Items Endpoints", () => {
		// Create a fresh order for order item tests
		beforeAll(async () => {
			const orderPayload = {
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
				.send(orderPayload);
			orderId = res.body.data.order.id;
		});

		afterAll(async () => {
			// Clean up any order items created during these tests.
			await pool.query("DELETE FROM order_items WHERE order_id = $1", [
				orderId,
			]);
			// Do not delete the order until order item tests complete (or delete it here if needed)
			await pool.query("DELETE FROM orders WHERE id = $1", [orderId]);
		});

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
			expect(res.body.data.item).toBeDefined();
			expect(res.body.data.item.product_id).toEqual(productId);
			orderItemId = res.body.data.item.id;
		});

		it("should return 422 if required fields are missing when creating an order item", async () => {
			const res = await request(app)
				.post(`/v1/orders/${orderId}/items`)
				.set("Authorization", `Bearer ${authToken}`)
				.send({ quantity: 2, price: 19.99 }); // Missing product_id
			expect(res.statusCode).toEqual(422);
			expect(res.body.message).toBeDefined();
		});

		it("should retrieve all order items for the order", async () => {
			const res = await request(app)
				.get(`/v1/orders/${orderId}/items`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(Array.isArray(res.body.data.items)).toBe(true);
			const item = res.body.data.items.find((i) => i.id === orderItemId);
			expect(item).toBeDefined();
		});

		it("should retrieve a specific order item", async () => {
			const res = await request(app)
				.get(`/v1/orders/${orderId}/items/${orderItemId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.data.item).toBeDefined();
			expect(res.body.data.item.id).toEqual(orderItemId);
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
			expect(res.body.data.item).toBeDefined();
			expect(res.body.data.item.quantity).toEqual(3);
		});

		it("should delete an order item", async () => {
			const res = await request(app)
				.delete(`/v1/orders/${orderId}/items/${orderItemId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			expect(res.body.message).toEqual("Order item deleted successfully");
			// Verify deletion by attempting to fetch the deleted item.
			const getRes = await request(app)
				.get(`/v1/orders/${orderId}/items/${orderItemId}`)
				.set("Authorization", `Bearer ${authToken}`);
			expect(getRes.statusCode).toEqual(404);
		});
	});

	// New tests to verify pagination and ordering functionality.
	describe("Orders Pagination and Ordering", () => {
		let orderPayload1, orderPayload2;
		let orderId1, orderId2;

		beforeAll(async () => {
			// Now customerId is already set from the outer beforeAll
			orderPayload1 = {
				customer_id: customerId,
				status: "pending",
				order_total: 50.0,
				refund_total: null,
				refund_date: null,
				refund_status: "none",
				refund_reason: null,
			};
			orderPayload2 = {
				customer_id: customerId,
				status: "pending",
				order_total: 100.0,
				refund_total: null,
				refund_date: null,
				refund_status: "none",
				refund_reason: null,
			};

			// Create the orders using the properly defined payloads
			let res = await request(app)
				.post("/v1/orders")
				.set("Authorization", `Bearer ${authToken}`)
				.send(orderPayload1);
			orderId1 = res.body.data.order.id;

			res = await request(app)
				.post("/v1/orders")
				.set("Authorization", `Bearer ${authToken}`)
				.send(orderPayload2);
			orderId2 = res.body.data.order.id;
		});

		afterAll(async () => {
			// Clean up the orders created for pagination tests.
			if (orderId1) {
				await pool.query("DELETE FROM orders WHERE id = $1", [
					orderId1,
				]);
			}
			if (orderId2) {
				await pool.query("DELETE FROM orders WHERE id = $1", [
					orderId2,
				]);
			}
		});

		it("should retrieve paginated orders with ordering by order_total descending", async () => {
			// With limit = 1, page = 1 and ordering by order_total descending,
			// the returned order should be the one with order_total 100.0.
			const res = await request(app)
				.get("/v1/orders?page=1&limit=1&orderBy=order_total&order=desc")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			const { total, orders, page, limit } = res.body.data;
			expect(typeof total).toBe("number");
			expect(page).toEqual(1);
			expect(limit).toEqual(1);
			expect(Array.isArray(orders)).toBe(true);
			expect(orders.length).toEqual(1);
			expect(orders[0].order_total).toEqual("100.00");
		});

		it("should retrieve paginated orders with ordering by order_total ascending", async () => {
			// With limit = 1, page = 1 and ordering by order_total ascending,
			// the returned order should be the one with order_total 50.0.
			const res = await request(app)
				.get("/v1/orders?page=1&limit=1&orderBy=order_total&order=asc")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			const { total, orders, page, limit } = res.body.data;
			expect(typeof total).toBe("number");
			expect(page).toEqual(1);
			expect(limit).toEqual(1);
			expect(Array.isArray(orders)).toBe(true);
			expect(orders.length).toEqual(1);
			expect(orders[0].order_total).toEqual("50.00");
		});

		it("should return an empty orders array for a page with no records", async () => {
			// Requesting a page number beyond the available number of orders should return an empty array.
			const res = await request(app)
				.get("/v1/orders?page=100&limit=10")
				.set("Authorization", `Bearer ${authToken}`);
			expect(res.statusCode).toEqual(200);
			const { orders } = res.body.data;
			expect(Array.isArray(orders)).toBe(true);
			expect(orders.length).toEqual(0);
		});
	});
});
