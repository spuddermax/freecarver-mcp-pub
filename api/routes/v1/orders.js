// /api/routes/v1/orders.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";
import validateRequest from "../../middleware/validateRequest.js";

import {
	createOrderSchema,
	updateOrderSchema,
	orderIdSchema,
	orderParamSchema,
	createOrderItemSchema,
	orderItemIdSchema,
} from "../../validators/orders.js";

const router = express.Router();

// Protect all routes in this file.
router.use(verifyJWT);

/**
 * @route GET /v1/orders
 * @description Retrieve a list of orders with optional pagination and ordering.
 * The endpoint supports the following query parameters:
 *   @param {number} [page=1] - The page number (default: 1).
 *   @param {number} [limit=20] - The number of orders per page (default: 20).
 *   @param {string} [orderBy=id] - The column to order by. Allowed columns:
 *         [id, customer_id, order_total, created_at, updated_at] (default: id).
 *   @param {string} [order=asc] - The order direction: "asc" (ascending) or "desc" (descending) (default: asc).
 * @access Protected
 * @returns {Response} 200 - Returns a JSON object with the total number of orders, paginated orders, current page, and limit.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.get("/", async (req, res) => {
	try {
		// Extract pagination and ordering query parameters, or use defaults.
		const page = parseInt(req.query.page, 10) || 1;
		const limit = parseInt(req.query.limit, 10) || 20;
		const offset = (page - 1) * limit;

		// Define allowed columns for ordering.
		const allowedOrderColumns = [
			"id",
			"customer_id",
			"order_total",
			"created_at",
			"updated_at",
		];
		const orderBy = allowedOrderColumns.includes(req.query.orderBy)
			? req.query.orderBy
			: "id";
		const orderDirection =
			req.query.order && req.query.order.toLowerCase() === "desc"
				? "DESC"
				: "ASC";

		// Get total number of orders.
		const countResult = await pool.query("SELECT COUNT(*) FROM orders");
		const total = parseInt(countResult.rows[0].count, 10);

		// Fetch paginated orders.
		const queryText = `SELECT * FROM orders ORDER BY ${orderBy} ${orderDirection} LIMIT $1 OFFSET $2`;
		const result = await pool.query(queryText, [limit, offset]);

		logger.info("Retrieved orders list with pagination.", {
			page,
			limit,
			orderBy,
			orderDirection,
		});
		res.success(
			{ total, orders: result.rows, page, limit },
			"Orders retrieved successfully"
		);
	} catch (error) {
		logger.error("Error retrieving orders.", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route POST /v1/orders
 * @description Create a new order.
 * @access Protected
 * @param {Object} req.body - The request body.
 * @param {number} req.body.customer_id - The ID of the customer placing the order (required).
 * @param {number} req.body.order_total - The total amount for the order (required).
 * @param {string} [req.body.status] - The order status.
 * @param {number} [req.body.refund_total] - The refund total.
 * @param {string} [req.body.refund_date] - The date of the refund.
 * @param {string} [req.body.refund_status] - The refund status.
 * @param {string} [req.body.refund_reason] - The reason for the refund.
 * @returns {Response} 201 - Returns a JSON object containing the newly created order.
 * @returns {Response} 400 - Returns an error if customer_id or order_total is missing.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.post("/", validateRequest(createOrderSchema), async (req, res) => {
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

		// No manual check required since validation now handles required fields.
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
		res.success(
			{ order: result.rows[0] },
			"Order created successfully",
			201
		);
	} catch (error) {
		logger.error("Error creating order.", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route GET /v1/orders/:id
 * @description Retrieve details for a specific order.
 * @access Protected
 * @param {string} req.params.id - The ID of the order.
 * @returns {Response} 200 - Returns a JSON object containing the order details.
 * @returns {Response} 404 - Returns an error if the order is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.get(
	"/:id",
	validateRequest(orderIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"SELECT * FROM orders WHERE id = $1",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(`Order with ID ${id} not found.`);
				return res.error("Order not found.", 404);
			}
			logger.info(`Retrieved order with ID ${id}.`);
			res.success(
				{ order: result.rows[0] },
				"Order retrieved successfully"
			);
		} catch (error) {
			logger.error(`Error retrieving order with ID ${req.params.id}.`, {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route PUT /v1/orders/:id
 * @description Update an existing order.
 * @access Protected
 * @param {string} req.params.id - The ID of the order to update.
 * @param {Object} req.body - The updated order details.
 * @param {number} [req.body.customer_id] - The updated customer ID.
 * @param {string} [req.body.status] - The updated order status.
 * @param {number} [req.body.order_total] - The updated order total.
 * @param {number} [req.body.refund_total] - The updated refund total.
 * @param {string} [req.body.refund_date] - The updated refund date.
 * @param {string} [req.body.refund_status] - The updated refund status.
 * @param {string} [req.body.refund_reason] - The updated refund reason.
 * @returns {Response} 200 - Returns a JSON object containing the updated order.
 * @returns {Response} 404 - Returns an error if the order is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.put(
	"/:id",
	validateRequest(orderIdSchema, "params"),
	validateRequest(updateOrderSchema),
	async (req, res) => {
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
				return res.error("Order not found.", 404);
			}
			logger.info(`Order with ID ${id} updated successfully.`);
			res.success(
				{ order: result.rows[0] },
				"Order updated successfully"
			);
		} catch (error) {
			logger.error(`Error updating order with ID ${req.params.id}.`, {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route DELETE /v1/orders/:id
 * @description Delete an order by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the order to delete.
 * @returns {Response} 200 - Returns a JSON object indicating successful deletion.
 * @returns {Response} 404 - Returns an error if the order is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
router.delete(
	"/:id",
	validateRequest(orderIdSchema, "params"),
	async (req, res) => {
		try {
			const { id } = req.params;
			const result = await pool.query(
				"DELETE FROM orders WHERE id = $1 RETURNING id",
				[id]
			);
			if (result.rows.length === 0) {
				logger.error(`Order with ID ${id} not found for deletion.`);
				return res.error("Order not found.", 404);
			}
			logger.info(`Order with ID ${id} deleted successfully.`);
			res.success(null, "Order deleted successfully");
		} catch (error) {
			logger.error(`Error deleting order with ID ${req.params.id}.`, {
				error: error.message,
			});
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/orders/:orderId/items
 * @description Retrieve all order items for a given order.
 * @access Protected
 * @param {string} req.params.orderId - The ID of the order.
 * @returns {Response} 200 - Returns a JSON object containing an array of order items.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
const itemsRouter = express.Router({ mergeParams: true });

// Validate the orderId parameter for all nested order items routes.
itemsRouter.use(validateRequest(orderParamSchema, "params"));

/**
 * @route GET /v1/orders/:orderId/items
 * @description Retrieve order items for a given order.
 * @access Protected
 */
itemsRouter.get("/", async (req, res) => {
	try {
		const { orderId } = req.params;
		const result = await pool.query(
			"SELECT * FROM order_items WHERE order_id = $1 ORDER BY id",
			[orderId]
		);
		logger.info(`Retrieved order items for order ID ${orderId}.`);
		res.success(
			{ items: result.rows },
			"Order items retrieved successfully"
		);
	} catch (error) {
		logger.error(
			`Error retrieving order items for order ID ${req.params.orderId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route POST /v1/orders/:orderId/items
 * @description Create a new order item for a given order.
 * @access Protected
 * @param {string} req.params.orderId - The ID of the order.
 * @param {Object} req.body - The order item details.
 * @param {number} req.body.product_id - The product ID (required).
 * @param {number} req.body.quantity - The quantity (required).
 * @param {number} req.body.price - The price (required).
 * @returns {Response} 201 - Returns a JSON object containing the newly created order item.
 * @returns {Response} 400 - Returns an error if required fields are missing.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
itemsRouter.post(
	"/",
	validateRequest(createOrderItemSchema),
	async (req, res) => {
		try {
			const { orderId } = req.params;
			const { product_id, quantity, price } = req.body;
			const query = `
      INSERT INTO order_items (order_id, product_id, quantity, price)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
			const values = [orderId, product_id, quantity, price];
			const result = await pool.query(query, values);
			logger.info(
				`Order item created successfully for order ID ${orderId}.`
			);
			res.success(
				{ item: result.rows[0] },
				"Order item created successfully",
				201
			);
		} catch (error) {
			logger.error(
				`Error creating order item for order ID ${req.params.orderId}.`,
				{ error: error.message }
			);
			res.error("Internal server error", 500);
		}
	}
);

/**
 * @route GET /v1/orders/:orderId/items/:itemId
 * @description Retrieve details for a specific order item.
 * @access Protected
 * @param {string} req.params.orderId - The ID of the order.
 * @param {string} req.params.itemId - The ID of the order item.
 * @returns {Response} 200 - Returns a JSON object containing the order item details.
 * @returns {Response} 404 - Returns an error if the order item is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
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
			return res.error("Order item not found.", 404);
		}
		logger.info(
			`Retrieved order item with ID ${itemId} for order ID ${orderId}.`
		);
		res.success(
			{ item: result.rows[0] },
			"Order item retrieved successfully"
		);
	} catch (error) {
		logger.error(
			`Error retrieving order item with ID ${req.params.itemId} for order ID ${req.params.orderId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route PUT /v1/orders/:orderId/items/:itemId
 * @description Update an existing order item.
 * @access Protected
 * @param {string} req.params.orderId - The ID of the order.
 * @param {string} req.params.itemId - The ID of the order item to update.
 * @param {Object} req.body - The updated order item details.
 * @param {number} req.body.product_id - The updated product ID (required).
 * @param {number} req.body.quantity - The updated quantity (required).
 * @param {number} req.body.price - The updated price (required).
 * @returns {Response} 200 - Returns a JSON object containing the updated order item.
 * @returns {Response} 400 - Returns an error if required fields are missing.
 * @returns {Response} 404 - Returns an error if the order item is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
 */
itemsRouter.put("/:itemId", async (req, res) => {
	try {
		const { orderId, itemId } = req.params;
		const { product_id, quantity, price } = req.body;
		if (!product_id || quantity === undefined || price === undefined) {
			logger.error(
				"Order item update failed: product_id, quantity, and price are required."
			);
			return res.error(
				"product_id, quantity, and price are required.",
				400
			);
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
			return res.error("Order item not found.", 404);
		}
		logger.info(
			`Order item with ID ${itemId} for order ID ${orderId} updated successfully.`
		);
		res.success(
			{ item: result.rows[0] },
			"Order item updated successfully"
		);
	} catch (error) {
		logger.error(
			`Error updating order item with ID ${req.params.itemId} for order ID ${req.params.orderId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route DELETE /v1/orders/:orderId/items/:itemId
 * @description Delete a specific order item.
 * @access Protected
 * @param {string} req.params.orderId - The ID of the order.
 * @param {string} req.params.itemId - The ID of the order item to delete.
 * @returns {Response} 200 - Returns a JSON object indicating successful deletion.
 * @returns {Response} 404 - Returns an error if the order item is not found.
 * @returns {Response} 500 - Returns an error message for an internal server error.
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
			return res.error("Order item not found.", 404);
		}
		logger.info(
			`Order item with ID ${itemId} for order ID ${orderId} deleted successfully.`
		);
		res.success(null, "Order item deleted successfully");
	} catch (error) {
		logger.error(
			`Error deleting order item with ID ${req.params.itemId} for order ID ${req.params.orderId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

// Mount the order items router under the path /:orderId/items
router.use("/:orderId/items", itemsRouter);

export default router;
