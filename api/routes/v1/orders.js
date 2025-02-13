// /api/routes/v1/orders.js

import express from "express";
import { pool } from "../../db.js";
import logger from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Protect all routes in this file.
router.use(verifyJWT);

/**
 * GET /v1/orders
 * Retrieve a list of all orders.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query("SELECT * FROM orders ORDER BY id");
		logger.info("Retrieved orders list.");
		res.status(200).json({ orders: result.rows });
	} catch (error) {
		logger.error("Error retrieving orders.", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /v1/orders
 * Create a new order.
 * Required: customer_id, order_total.
 * Optional: status, refund_total, refund_date, refund_status, refund_reason.
 */
router.post("/", async (req, res) => {
	try {
		const {
			customer_id,
			status,
			order_total,
			refund_total,
			refund_date,
			refund_status,
			refund_reason,
		} = req.body;
		if (!customer_id || order_total === undefined) {
			logger.error(
				"Order creation failed: customer_id and order_total are required."
			);
			return res
				.status(400)
				.json({ error: "customer_id and order_total are required." });
		}
		const query = `
      INSERT INTO orders (customer_id, status, order_total, refund_total, refund_date, refund_status, refund_reason)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
		const values = [
			customer_id,
			status || "pending",
			order_total,
			refund_total,
			refund_date,
			refund_status || "none",
			refund_reason,
		];
		const result = await pool.query(query, values);
		logger.info(`Order created successfully with ID ${result.rows[0].id}.`);
		res.status(201).json({ order: result.rows[0] });
	} catch (error) {
		logger.error("Error creating order.", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /v1/orders/:id
 * Retrieve details for a specific order.
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query("SELECT * FROM orders WHERE id = $1", [
			id,
		]);
		if (result.rows.length === 0) {
			logger.error(`Order with ID ${id} not found.`);
			return res.status(404).json({ error: "Order not found." });
		}
		logger.info(`Retrieved order with ID ${id}.`);
		res.status(200).json({ order: result.rows[0] });
	} catch (error) {
		logger.error(`Error retrieving order with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PUT /v1/orders/:id
 * Update an existing order.
 * Accepts updates to: customer_id, status, order_total, refund_total, refund_date, refund_status, refund_reason.
 */
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const {
			customer_id,
			status,
			order_total,
			refund_total,
			refund_date,
			refund_status,
			refund_reason,
		} = req.body;
		const query = `
      UPDATE orders
      SET customer_id = $1,
          status = $2,
          order_total = $3,
          refund_total = $4,
          refund_date = $5,
          refund_status = $6,
          refund_reason = $7,
          updated_at = NOW()
      WHERE id = $8
      RETURNING *;
    `;
		const values = [
			customer_id,
			status,
			order_total,
			refund_total,
			refund_date,
			refund_status,
			refund_reason,
			id,
		];
		const result = await pool.query(query, values);
		if (result.rows.length === 0) {
			logger.error(`Order with ID ${id} not found for update.`);
			return res.status(404).json({ error: "Order not found." });
		}
		logger.info(`Order with ID ${id} updated successfully.`);
		res.status(200).json({ order: result.rows[0] });
	} catch (error) {
		logger.error(`Error updating order with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * DELETE /v1/orders/:id
 * Delete an order by ID.
 */
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"DELETE FROM orders WHERE id = $1 RETURNING id",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Order with ID ${id} not found for deletion.`);
			return res.status(404).json({ error: "Order not found." });
		}
		logger.info(`Order with ID ${id} deleted successfully.`);
		res.status(200).json({ message: "Order deleted successfully." });
	} catch (error) {
		logger.error(`Error deleting order with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * Order Items Endpoints (Nested Routes)
 */
const itemsRouter = express.Router({ mergeParams: true });

/**
 * GET /v1/orders/:orderId/items
 * Retrieve all order items for a given order.
 */
itemsRouter.get("/", async (req, res) => {
	try {
		const { orderId } = req.params;
		const result = await pool.query(
			"SELECT * FROM order_items WHERE order_id = $1 ORDER BY id",
			[orderId]
		);
		logger.info(`Retrieved order items for order ID ${orderId}.`);
		res.status(200).json({ items: result.rows });
	} catch (error) {
		logger.error(
			`Error retrieving order items for order ID ${req.params.orderId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /v1/orders/:orderId/items
 * Create a new order item for a given order.
 * Required: product_id, quantity, price.
 */
itemsRouter.post("/", async (req, res) => {
	try {
		const { orderId } = req.params;
		const { product_id, quantity, price } = req.body;
		if (!product_id || quantity === undefined || price === undefined) {
			logger.error(
				"Order item creation failed: product_id, quantity, and price are required."
			);
			return res.status(400).json({
				error: "product_id, quantity, and price are required.",
			});
		}
		const query = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
		const values = [orderId, product_id, quantity, price];
		const result = await pool.query(query, values);
		logger.info(`Order item created successfully for order ID ${orderId}.`);
		res.status(201).json({ item: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error creating order item for order ID ${req.params.orderId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /v1/orders/:orderId/items/:itemId
 * Retrieve details for a specific order item.
 */
itemsRouter.get("/:itemId", async (req, res) => {
	try {
		const { orderId, itemId } = req.params;
		const result = await pool.query(
			"SELECT * FROM order_items WHERE order_id = $1 AND id = $2",
			[orderId, itemId]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Order item with ID ${itemId} for order ID ${orderId} not found.`
			);
			return res.status(404).json({ error: "Order item not found." });
		}
		logger.info(
			`Retrieved order item with ID ${itemId} for order ID ${orderId}.`
		);
		res.status(200).json({ item: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error retrieving order item with ID ${req.params.itemId} for order ID ${req.params.orderId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PUT /v1/orders/:orderId/items/:itemId
 * Update an existing order item.
 * Accepts: product_id, quantity, price.
 */
itemsRouter.put("/:itemId", async (req, res) => {
	try {
		const { orderId, itemId } = req.params;
		const { product_id, quantity, price } = req.body;
		if (!product_id || quantity === undefined || price === undefined) {
			logger.error(
				"Order item update failed: product_id, quantity, and price are required."
			);
			return res.status(400).json({
				error: "product_id, quantity, and price are required.",
			});
		}
		const query = `
      UPDATE order_items
      SET product_id = $1,
          quantity = $2,
          price = $3,
          updated_at = NOW()
      WHERE order_id = $4 AND id = $5
      RETURNING *;
    `;
		const values = [product_id, quantity, price, orderId, itemId];
		const result = await pool.query(query, values);
		if (result.rows.length === 0) {
			logger.error(
				`Order item with ID ${itemId} for order ID ${orderId} not found for update.`
			);
			return res.status(404).json({ error: "Order item not found." });
		}
		logger.info(
			`Order item with ID ${itemId} for order ID ${orderId} updated successfully.`
		);
		res.status(200).json({ item: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error updating order item with ID ${req.params.itemId} for order ID ${req.params.orderId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * DELETE /v1/orders/:orderId/items/:itemId
 * Delete a specific order item.
 */
itemsRouter.delete("/:itemId", async (req, res) => {
	try {
		const { orderId, itemId } = req.params;
		const result = await pool.query(
			"DELETE FROM order_items WHERE order_id = $1 AND id = $2 RETURNING id",
			[orderId, itemId]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Order item with ID ${itemId} for order ID ${orderId} not found for deletion.`
			);
			return res.status(404).json({ error: "Order item not found." });
		}
		logger.info(
			`Order item with ID ${itemId} for order ID ${orderId} deleted successfully.`
		);
		res.status(200).json({ message: "Order item deleted successfully." });
	} catch (error) {
		logger.error(
			`Error deleting order item with ID ${req.params.itemId} for order ID ${req.params.orderId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Mount the order items router under the path /:orderId/items
router.use("/:orderId/items", itemsRouter);

export default router;
