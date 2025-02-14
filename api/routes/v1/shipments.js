// /api/routes/v1/shipments.js

import express from "express";
import { pool } from "../../db.js";
import { logger } from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Protect all endpoints in this file.
router.use(verifyJWT);

/**
 * @route GET /v1/shipments
 * @description Retrieve a list of all shipments.
 * @access Protected
 * @returns {Response} 200 - JSON object containing an array of shipments.
 * @returns {Response} 500 - Internal server error.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query("SELECT * FROM shipments ORDER BY id");
		logger.info("Retrieved shipments list.");
		res.success(
			{ shipments: result.rows },
			"Shipments retrieved successfully"
		);
	} catch (error) {
		logger.error("Error retrieving shipments.", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route POST /v1/shipments
 * @description Create a new shipment.
 * @access Protected
 * @param {Object} req.body - The shipment details.
 * @param {number} req.body.order_id - The ID of the order associated with the shipment (required).
 * @param {string} req.body.shipment_date - The shipment date (required).
 * @param {string} req.body.tracking_number - The tracking number (required).
 * @param {string} req.body.shipping_carrier - The shipping carrier (required).
 * @param {string} req.body.status - The shipment status (required).
 * @returns {Response} 201 - JSON object containing the newly created shipment.
 * @returns {Response} 400 - Bad request if required fields are missing.
 * @returns {Response} 500 - Internal server error.
 */
router.post("/", async (req, res) => {
	try {
		const {
			order_id,
			shipment_date,
			tracking_number,
			shipping_carrier,
			status,
		} = req.body;
		if (
			!order_id ||
			!shipment_date ||
			!tracking_number ||
			!shipping_carrier ||
			!status
		) {
			logger.error("Shipment creation failed: Missing required fields.");
			return res.error(
				"order_id, shipment_date, tracking_number, shipping_carrier, and status are required.",
				400
			);
		}
		const query = `
      INSERT INTO shipments (order_id, shipment_date, tracking_number, shipping_carrier, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;
		const values = [
			order_id,
			shipment_date,
			tracking_number,
			shipping_carrier,
			status,
		];
		const result = await pool.query(query, values);
		logger.info(
			`Shipment created successfully with ID ${result.rows[0].id}.`
		);
		res.success(
			{ shipment: result.rows[0] },
			"Shipment created successfully"
		);
	} catch (error) {
		logger.error("Error creating shipment.", { error: error.message });
		res.error("Internal server error", 500);
	}
});

/**
 * @route GET /v1/shipments/:id
 * @description Retrieve details for a specific shipment.
 * @access Protected
 * @param {string} req.params.id - The ID of the shipment.
 * @returns {Response} 200 - JSON object containing the shipment details.
 * @returns {Response} 404 - Not found if the shipment does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.get("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"SELECT * FROM shipments WHERE id = $1",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Shipment with ID ${id} not found.`);
			return res.error("Shipment not found.", 404);
		}
		logger.info(`Retrieved shipment with ID ${id}.`);
		res.success(
			{ shipment: result.rows[0] },
			"Shipment retrieved successfully"
		);
	} catch (error) {
		logger.error(`Error retrieving shipment with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route PUT /v1/shipments/:id
 * @description Update an existing shipment.
 * @access Protected
 * @param {string} req.params.id - The ID of the shipment to update.
 * @param {Object} req.body - The updated shipment details.
 * @param {number} req.body.order_id - The updated order ID.
 * @param {string} req.body.shipment_date - The updated shipment date.
 * @param {string} req.body.tracking_number - The updated tracking number.
 * @param {string} req.body.shipping_carrier - The updated shipping carrier.
 * @param {string} req.body.status - The updated shipment status.
 * @returns {Response} 200 - JSON object containing the updated shipment.
 * @returns {Response} 404 - Not found if the shipment does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.put("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const {
			order_id,
			shipment_date,
			tracking_number,
			shipping_carrier,
			status,
		} = req.body;
		const query = `
      UPDATE shipments
      SET order_id = $1,
          shipment_date = $2,
          tracking_number = $3,
          shipping_carrier = $4,
          status = $5,
          updated_at = NOW()
      WHERE id = $6
      RETURNING *;
    `;
		const values = [
			order_id,
			shipment_date,
			tracking_number,
			shipping_carrier,
			status,
			id,
		];
		const result = await pool.query(query, values);
		if (result.rows.length === 0) {
			logger.error(`Shipment with ID ${id} not found for update.`);
			return res.error("Shipment not found.", 404);
		}
		logger.info(`Shipment with ID ${id} updated successfully.`);
		res.success(
			{ shipment: result.rows[0] },
			"Shipment updated successfully"
		);
	} catch (error) {
		logger.error(`Error updating shipment with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route DELETE /v1/shipments/:id
 * @description Delete a shipment by ID.
 * @access Protected
 * @param {string} req.params.id - The ID of the shipment to delete.
 * @returns {Response} 200 - JSON object indicating successful deletion.
 * @returns {Response} 404 - Not found if the shipment does not exist.
 * @returns {Response} 500 - Internal server error.
 */
router.delete("/:id", async (req, res) => {
	try {
		const { id } = req.params;
		const result = await pool.query(
			"DELETE FROM shipments WHERE id = $1 RETURNING id",
			[id]
		);
		if (result.rows.length === 0) {
			logger.error(`Shipment with ID ${id} not found for deletion.`);
			return res.error("Shipment not found.", 404);
		}
		logger.info(`Shipment with ID ${id} deleted successfully.`);
		res.success(null, "Shipment deleted successfully");
	} catch (error) {
		logger.error(`Error deleting shipment with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.error("Internal server error", 500);
	}
});

/**
 * @route GET /v1/shipments/:shipmentId/items
 * @description Retrieve all shipment items for a given shipment.
 * @access Protected
 * @param {string} req.params.shipmentId - The ID of the shipment.
 * @returns {Response} 200 - JSON object containing an array of shipment items.
 * @returns {Response} 500 - Internal server error.
 */
const itemsRouter = express.Router({ mergeParams: true });
itemsRouter.get("/", async (req, res) => {
	try {
		const { shipmentId } = req.params;
		const result = await pool.query(
			"SELECT * FROM shipment_items WHERE shipment_id = $1 ORDER BY id",
			[shipmentId]
		);
		logger.info(`Retrieved shipment items for shipment ID ${shipmentId}.`);
		res.success(
			{ items: result.rows },
			"Shipment items retrieved successfully"
		);
	} catch (error) {
		logger.error(
			`Error retrieving shipment items for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route POST /v1/shipments/:shipmentId/items
 * @description Create a new shipment item for a given shipment.
 * @access Protected
 * @param {string} req.params.shipmentId - The ID of the shipment.
 * @param {Object} req.body - The shipment item details.
 * @param {number} req.body.order_item_id - The order item ID (required).
 * @param {number} req.body.quantity_shipped - The quantity shipped (required).
 * @returns {Response} 201 - JSON object containing the newly created shipment item.
 * @returns {Response} 400 - Bad request if required fields are missing.
 * @returns {Response} 500 - Internal server error.
 */
itemsRouter.post("/", async (req, res) => {
	try {
		const { shipmentId } = req.params;
		const { order_item_id, quantity_shipped } = req.body;
		if (!order_item_id || quantity_shipped === undefined) {
			logger.error(
				"Shipment item creation failed: order_item_id and quantity_shipped are required."
			);
			return res.error(
				"order_item_id and quantity_shipped are required.",
				400
			);
		}
		const query = `
      INSERT INTO shipment_items (shipment_id, order_item_id, quantity_shipped)
      VALUES ($1, $2, $3)
      RETURNING *;
    `;
		const values = [shipmentId, order_item_id, quantity_shipped];
		const result = await pool.query(query, values);
		logger.info(
			`Shipment item created successfully for shipment ID ${shipmentId}.`
		);
		res.success(
			{ item: result.rows[0] },
			"Shipment item created successfully"
		);
	} catch (error) {
		logger.error(
			`Error creating shipment item for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route GET /v1/shipments/:shipmentId/items/:itemId
 * @description Retrieve details for a specific shipment item.
 * @access Protected
 * @param {string} req.params.shipmentId - The ID of the shipment.
 * @param {string} req.params.itemId - The ID of the shipment item.
 * @returns {Response} 200 - JSON object containing the shipment item details.
 * @returns {Response} 404 - Not found if the shipment item does not exist.
 * @returns {Response} 500 - Internal server error.
 */
itemsRouter.get("/:itemId", async (req, res) => {
	try {
		const { shipmentId, itemId } = req.params;
		const result = await pool.query(
			"SELECT * FROM shipment_items WHERE shipment_id = $1 AND id = $2",
			[shipmentId, itemId]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Shipment item with ID ${itemId} for shipment ID ${shipmentId} not found.`
			);
			return res.error("Shipment item not found.", 404);
		}
		logger.info(
			`Retrieved shipment item with ID ${itemId} for shipment ID ${shipmentId}.`
		);
		res.success(
			{ item: result.rows[0] },
			"Shipment item retrieved successfully"
		);
	} catch (error) {
		logger.error(
			`Error retrieving shipment item with ID ${req.params.itemId} for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route PUT /v1/shipments/:shipmentId/items/:itemId
 * @description Update an existing shipment item.
 * @access Protected
 * @param {string} req.params.shipmentId - The ID of the shipment.
 * @param {string} req.params.itemId - The ID of the shipment item to update.
 * @param {Object} req.body - The updated shipment item details.
 * @param {number} req.body.order_item_id - The updated order item ID (required).
 * @param {number} req.body.quantity_shipped - The updated quantity shipped (required).
 * @returns {Response} 200 - JSON object containing the updated shipment item.
 * @returns {Response} 400 - Bad request if required fields are missing.
 * @returns {Response} 404 - Not found if the shipment item does not exist.
 * @returns {Response} 500 - Internal server error.
 */
itemsRouter.put("/:itemId", async (req, res) => {
	try {
		const { shipmentId, itemId } = req.params;
		const { order_item_id, quantity_shipped } = req.body;
		if (!order_item_id || quantity_shipped === undefined) {
			logger.error(
				"Shipment item update failed: order_item_id and quantity_shipped are required."
			);
			return res.error(
				"order_item_id and quantity_shipped are required.",
				400
			);
		}
		const query = `
      UPDATE shipment_items
      SET order_item_id = $1,
          quantity_shipped = $2,
          updated_at = NOW()
      WHERE shipment_id = $3 AND id = $4
      RETURNING *;
    `;
		const values = [order_item_id, quantity_shipped, shipmentId, itemId];
		const result = await pool.query(query, values);
		if (result.rows.length === 0) {
			logger.error(
				`Shipment item with ID ${itemId} for shipment ID ${shipmentId} not found for update.`
			);
			return res.error("Shipment item not found.", 404);
		}
		logger.info(
			`Shipment item with ID ${itemId} for shipment ID ${shipmentId} updated successfully.`
		);
		res.success(
			{ item: result.rows[0] },
			"Shipment item updated successfully"
		);
	} catch (error) {
		logger.error(
			`Error updating shipment item with ID ${req.params.itemId} for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

/**
 * @route DELETE /v1/shipments/:shipmentId/items/:itemId
 * @description Delete a shipment item by ID.
 * @access Protected
 * @param {string} req.params.shipmentId - The ID of the shipment.
 * @param {string} req.params.itemId - The ID of the shipment item to delete.
 * @returns {Response} 200 - JSON object indicating successful deletion.
 * @returns {Response} 404 - Not found if the shipment item does not exist.
 * @returns {Response} 500 - Internal server error.
 */
itemsRouter.delete("/:itemId", async (req, res) => {
	try {
		const { shipmentId, itemId } = req.params;
		const result = await pool.query(
			"DELETE FROM shipment_items WHERE shipment_id = $1 AND id = $2 RETURNING id",
			[shipmentId, itemId]
		);
		if (result.rows.length === 0) {
			logger.error(
				`Shipment item with ID ${itemId} for shipment ID ${shipmentId} not found for deletion.`
			);
			return res.error("Shipment item not found.", 404);
		}
		logger.info(
			`Shipment item with ID ${itemId} for shipment ID ${shipmentId} deleted successfully.`
		);
		res.success(null, "Shipment item deleted successfully");
	} catch (error) {
		logger.error(
			`Error deleting shipment item with ID ${req.params.itemId} for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.error("Internal server error", 500);
	}
});

// Mount the itemsRouter under the path /:shipmentId/items
router.use("/:shipmentId/items", itemsRouter);

export default router;
