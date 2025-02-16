// /api/validators/orders.js

import Joi from "joi";

export const createOrderSchema = Joi.object({
	customer_id: Joi.number().required(),
	order_total: Joi.number().required(),
	status: Joi.string().optional(),
	refund_total: Joi.number().optional().allow(null),
	refund_date: Joi.string().isoDate().optional().allow(null),
	refund_status: Joi.string().optional(),
	refund_reason: Joi.string().optional().allow(null),
});

export const updateOrderSchema = Joi.object({
	customer_id: Joi.number().required(),
	order_total: Joi.number().required(),
	status: Joi.string().optional(),
	refund_total: Joi.number().optional().allow(null),
	refund_date: Joi.string().isoDate().optional().allow(null),
	refund_status: Joi.string().optional(),
	refund_reason: Joi.string().optional().allow(null),
});

export const orderIdSchema = Joi.object({
	id: Joi.number().required(),
});

// This schema is used for validating orderId passed as param to nested order items routes.
export const orderParamSchema = Joi.object({
	orderId: Joi.number().required(),
});

export const createOrderItemSchema = Joi.object({
	product_id: Joi.number().required(),
	quantity: Joi.number().required(),
	price: Joi.number().required(),
});

export const orderItemIdSchema = Joi.object({
	itemId: Joi.number().required(),
}).unknown(true);
