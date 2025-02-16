export type OrdersPaginationOptions = {
	page?: number;
	limit?: number;
	orderBy?: string;
	order?: "asc" | "desc";
};

/**
 * Fetch all orders with optional pagination and ordering.
 * @param options - Optional pagination options: page, limit, orderBy, and order.
 * @returns A promise that resolves to an array of orders.
 */
export async function fetchOrders(
	options?: OrdersPaginationOptions
): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	let query = "";
	if (options) {
		const params = new URLSearchParams();
		if (options.page) params.append("page", String(options.page));
		if (options.limit) params.append("limit", String(options.limit));
		if (options.orderBy) params.append("orderBy", options.orderBy);
		if (options.order) params.append("order", options.order);
		query = "?" + params.toString();
	}

	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/orders" + query,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch orders");
	}

	const responseData = await response.json();
	return responseData.data.orders;
}

/**
 * Retrieve details for a specific order by ID.
 * @param id - The ID of the order.
 * @returns A promise that resolves to the order details.
 */
export async function fetchOrder(id: string): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/orders/${id}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch order details");
	}

	const responseData = await response.json();
	return responseData.data;
}

/**
 * Create a new order.
 * @param data - The order data.
 * @returns A promise that resolves to the created order.
 */
export async function createOrder(data: {
	customer_id: number;
	order_total: number;
	status: string;
	refund_total?: number;
	refund_date?: string;
	refund_status?: string;
}): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(import.meta.env.VITE_API_URL + "/v1/orders", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${token}`,
		},
		body: JSON.stringify(data),
	});

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to create order");
	}

	const responseData = await response.json();
	return responseData.data;
}

/**
 * Update an existing order.
 * @param data - The order data to update; must include the order ID.
 * @returns A promise that resolves to the updated order.
 */
export async function updateOrder(data: {
	id: string;
	customer_id?: number;
	order_total?: number;
	status?: string;
	refund_total?: number;
	refund_date?: string;
	refund_status?: string;
}): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/orders/${data.id}`,
		{
			method: "PUT",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to update order");
	}

	const responseData = await response.json();
	return responseData.data;
}

/**
 * Delete an order.
 * @param id - The ID of the order to delete.
 * @returns A promise that resolves to the deletion result.
 */
export async function deleteOrder(id: string): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/orders/${id}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);

	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to delete order");
	}

	const responseData = await response.json();
	return responseData.data;
}
