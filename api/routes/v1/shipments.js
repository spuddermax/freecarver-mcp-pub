// /api/routes/v1/shipments.js

import express from "express";
import { pool } from "../../db.js";
import logger from "../../logger.js";
import { verifyJWT } from "../../middleware/auth.js";

const router = express.Router();

// Protect all endpoints in this file.
router.use(verifyJWT);

/**
 * GET /v1/shipments
 * Retrieve a list of all shipments.
 */
router.get("/", async (req, res) => {
	try {
		const result = await pool.query("SELECT * FROM shipments ORDER BY id");
		logger.info("Retrieved shipments list.");
		res.status(200).json({ shipments: result.rows });
	} catch (error) {
		logger.error("Error retrieving shipments.", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /v1/shipments
 * Create a new shipment.
 * Required: order_id, shipment_date, tracking_number, shipping_carrier, status.
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
			return res
				.status(400)
				.json({
					error: "order_id, shipment_date, tracking_number, shipping_carrier, and status are required.",
				});
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
		res.status(201).json({ shipment: result.rows[0] });
	} catch (error) {
		logger.error("Error creating shipment.", { error: error.message });
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /v1/shipments/:id
 * Retrieve details for a specific shipment.
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
			return res.status(404).json({ error: "Shipment not found." });
		}
		logger.info(`Retrieved shipment with ID ${id}.`);
		res.status(200).json({ shipment: result.rows[0] });
	} catch (error) {
		logger.error(`Error retrieving shipment with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PUT /v1/shipments/:id
 * Update an existing shipment.
 * Accepts: order_id, shipment_date, tracking_number, shipping_carrier, status.
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
			return res.status(404).json({ error: "Shipment not found." });
		}
		logger.info(`Shipment with ID ${id} updated successfully.`);
		res.status(200).json({ shipment: result.rows[0] });
	} catch (error) {
		logger.error(`Error updating shipment with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * DELETE /v1/shipments/:id
 * Delete a shipment by ID.
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
			return res.status(404).json({ error: "Shipment not found." });
		}
		logger.info(`Shipment with ID ${id} deleted successfully.`);
		res.status(200).json({ message: "Shipment deleted successfully." });
	} catch (error) {
		logger.error(`Error deleting shipment with ID ${req.params.id}.`, {
			error: error.message,
		});
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * Nested Shipment Items Endpoints
 */
const itemsRouter = express.Router({ mergeParams: true });

/**
 * GET /v1/shipments/:shipmentId/items
 * Retrieve all shipment items for a given shipment.
 */
itemsRouter.get("/", async (req, res) => {
	try {
		const { shipmentId } = req.params;
		const result = await pool.query(
			"SELECT * FROM shipment_items WHERE shipment_id = $1 ORDER BY id",
			[shipmentId]
		);
		logger.info(`Retrieved shipment items for shipment ID ${shipmentId}.`);
		res.status(200).json({ items: result.rows });
	} catch (error) {
		logger.error(
			`Error retrieving shipment items for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /v1/shipments/:shipmentId/items
 * Create a new shipment item for a given shipment.
 * Required: order_item_id, quantity_shipped.
 */
itemsRouter.post("/", async (req, res) => {
	try {
		const { shipmentId } = req.params;
		const { order_item_id, quantity_shipped } = req.body;
		if (!order_item_id || quantity_shipped === undefined) {
			logger.error(
				"Shipment item creation failed: order_item_id and quantity_shipped are required."
			);
			return res
				.status(400)
				.json({
					error: "order_item_id and quantity_shipped are required.",
				});
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
		res.status(201).json({ item: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error creating shipment item for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /v1/shipments/:shipmentId/items/:itemId
 * Retrieve details for a specific shipment item.
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
			return res.status(404).json({ error: "Shipment item not found." });
		}
		logger.info(
			`Retrieved shipment item with ID ${itemId} for shipment ID ${shipmentId}.`
		);
		res.status(200).json({ item: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error retrieving shipment item with ID ${req.params.itemId} for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PUT /v1/shipments/:shipmentId/items/:itemId
 * Update an existing shipment item.
 * Accepts: order_item_id, quantity_shipped.
 */
itemsRouter.put("/:itemId", async (req, res) => {
	try {
		const { shipmentId, itemId } = req.params;
		const { order_item_id, quantity_shipped } = req.body;
		if (!order_item_id || quantity_shipped === undefined) {
			logger.error(
				"Shipment item update failed: order_item_id and quantity_shipped are required."
			);
			return res
				.status(400)
				.json({
					error: "order_item_id and quantity_shipped are required.",
				});
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
			return res.status(404).json({ error: "Shipment item not found." });
		}
		logger.info(
			`Shipment item with ID ${itemId} for shipment ID ${shipmentId} updated successfully.`
		);
		res.status(200).json({ item: result.rows[0] });
	} catch (error) {
		logger.error(
			`Error updating shipment item with ID ${req.params.itemId} for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * DELETE /v1/shipments/:shipmentId/items/:itemId
 * Delete a shipment item by ID.
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
			return res.status(404).json({ error: "Shipment item not found." });
		}
		logger.info(
			`Shipment item with ID ${itemId} for shipment ID ${shipmentId} deleted successfully.`
		);
		res.status(200).json({
			message: "Shipment item deleted successfully.",
		});
	} catch (error) {
		logger.error(
			`Error deleting shipment item with ID ${req.params.itemId} for shipment ID ${req.params.shipmentId}.`,
			{ error: error.message }
		);
		res.status(500).json({ error: "Internal server error" });
	}
});

// Mount the itemsRouter under /:shipmentId/items
router.use("/:shipmentId/items", itemsRouter);

export default router;
