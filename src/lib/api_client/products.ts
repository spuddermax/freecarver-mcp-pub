/**
 * Fetch all products.
 * @returns A promise that resolves to an array of products.
 */
export async function fetchProducts(): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/products",
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch products");
	}
	const responseData = await response.json();
	return responseData.data.products;
}

/**
 * Retrieve details for a specific product by ID.
 * @param id - The product ID.
 * @returns A promise that resolves to the product details.
 */
export async function fetchProduct(id: string): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/products/${id}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to fetch product details");
	}
	const responseData = await response.json();
	return responseData.data.product;
}

/**
 * Create a new product.
 * @param data - The product data.
 * @returns A promise that resolves to the created product.
 */
export async function createProduct(data: {
	name: string;
	description?: string;
	price?: number;
	sale_price?: number;
	sale_start?: string;
	sale_end?: string;
	product_media?: any;
}): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + "/v1/products",
		{
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
			},
			body: JSON.stringify(data),
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to create product");
	}
	const responseData = await response.json();
	return responseData.data.product;
}

/**
 * Update an existing product.
 * @param data - An object containing the product ID and the fields to update.
 * @returns A promise that resolves to the updated product.
 */
export async function updateProduct(data: {
	id: string;
	name?: string;
	description?: string;
	price?: number;
	sale_price?: number;
	sale_start?: string;
	sale_end?: string;
	product_media?: any;
}): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/products/${data.id}`,
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
		throw new Error(errorData.error || "Failed to update product");
	}
	const responseData = await response.json();
	return responseData.data.product;
}

/**
 * Delete a product by ID.
 * @param id - The product ID.
 * @returns A promise that resolves to the deletion result.
 */
export async function deleteProduct(id: string): Promise<any> {
	const token = localStorage.getItem("jwtToken");
	const response = await fetch(
		import.meta.env.VITE_API_URL + `/v1/products/${id}`,
		{
			method: "DELETE",
			headers: {
				Authorization: `Bearer ${token}`,
			},
		}
	);
	if (!response.ok) {
		const errorData = await response.json();
		throw new Error(errorData.error || "Failed to delete product");
	}
	const responseData = await response.json();
	return responseData.data;
}
