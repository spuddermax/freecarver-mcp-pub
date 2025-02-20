export interface Option {
	id: number;
	name: string;
	values: string[];
}

export interface ProductData {
	targetId: number;
	name: string;
	description: string;
	price: number;
	salePrice?: number;
	saleStart?: string;
	saleEnd?: string;
	sku?: string;
	productMedia?: string;
	options?: Option[];
	skus?: { combination: string; sku: string }[];
}
