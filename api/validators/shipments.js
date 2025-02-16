// /api/validators/shipments.js

import Joi from "joi";

export const createShipmentSchema = Joi.object({
	order_id: Joi.number().required(),
	shipment_date: Joi.string().isoDate().required(),
	tracking_number: Joi.string().required(),
	shipping_carrier: Joi.string().required(),
	status: Joi.string().required(),
});

export const updateShipmentSchema = Joi.object({
	order_id: Joi.number().required(),
	shipment_date: Joi.string().isoDate().required(),
	tracking_number: Joi.string().required(),
	shipping_carrier: Joi.string().required(),
	status: Joi.string().required(),
});

export const shipmentIdSchema = Joi.object({
	id: Joi.number().required(),
});

export const shipmentParamSchema = Joi.object({
	shipmentId: Joi.number().required(),
});

export const createShipmentItemSchema = Joi.object({
	order_item_id: Joi.number().required(),
	quantity_shipped: Joi.number().required(),
});

export const updateShipmentItemSchema = Joi.object({
	order_item_id: Joi.number().required(),
	quantity_shipped: Joi.number().required(),
});

export const shipmentItemIdSchema = Joi.object({
	itemId: Joi.number().required(),
});
