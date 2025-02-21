// /src/types/Interfaces.ts

export interface AdminRole {
	id: number;
	role_name: string;
	created_at: Date;
	updated_at: Date;
}

export interface AdminUser {
	id: number;
	email: string;
	password_hash: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	avatar_url: string;
	timezone: string;
	role_id: number;
	mfa_enabled: boolean;
	mfa_method: string;
	created_at: Date;
	updated_at: Date;
}

export interface AuditLog {
	id: number;
	admin_user_id: number | null;
	customer_id: number | null;
	crud_action: string;
	details: string;
	ip_address: string;
	created_at: Date;
}

export interface Customer {
	id: number;
	email: string;
	first_name: string;
	last_name: string;
	phone_number: string;
	password_hash: string;
	avatar_url: string;
	timezone: string;
	created_at: Date;
	updated_at: Date;
}

export interface CustomerAddress {
	id: number;
	customer_id: number;
	label: string;
	address_line1: string;
	address_line2: string;
	city: string;
	state: string;
	postal_code: string;
	country: string;
	address_type: string;
	created_at: Date;
	updated_at: Date;
}

export interface InventoryLocation {
	id: number;
	location_identifier: string;
	description: string;
	created_at: Date;
	updated_at: Date;
}

export interface InventoryProduct {
	id: number;
	product_id: number;
	product_option_variants_id: number | null;
	location_id: number;
	quantity: number;
	created_at: Date;
	updated_at: Date;
}

export interface Order {
	id: number;
	customer_id: number;
	order_date: Date;
	status: string;
	order_total: number;
	refund_total: number | null;
	refund_date: Date | null;
	refund_status: string;
	refund_reason: string;
	created_at: Date;
	updated_at: Date;
}

export interface OrderItem {
	id: number;
	order_id: number;
	product_id: number;
	quantity: number;
	price: number;
	created_at: Date;
	updated_at: Date;
}

export interface Product {
	id: number;
	sku: string;
	name: string;
	description: string;
	price: number | null;
	sale_price: number | null;
	sale_start: Date | null;
	sale_end: Date | null;
	product_media: ProductMedia[];
	created_at: Date;
	updated_at: Date;
	options: ProductOption[];
}

export interface ProductCategory {
	id: number;
	name: string;
	description: string;
	parent_category_id: number | null;
	created_at: Date;
	updated_at: Date;
}

export interface ProductCategoryAssignment {
	product_id: number;
	category_id: number;
	created_at: Date;
	updated_at: Date;
}

export interface ProductMedia {
	media_id: string;
	url: string;
	title: string;
}

export interface ProductOption {
	id: number;
	product_id: number;
	option_name: string;
	created_at: Date;
	updated_at: Date;
}

export interface ProductOptionVariant {
	id: number;
	product_id: number;
	option_id: number;
	name: string;
	sku: string;
	price: number;
	sale_price: number;
	sale_start: Date | null;
	sale_end: Date | null;
	media: ProductMedia[];
	created_at: Date;
	updated_at: Date;
}

export interface Shipment {
	id: number;
	order_id: number;
	shipment_date: Date;
	tracking_number: string;
	shipping_carrier: string;
	status: string;
	created_at: Date;
	updated_at: Date;
}

export interface ShipmentItem {
	id: number;
	shipment_id: number;
	order_item_id: number;
	quantity_shipped: number;
	created_at: Date;
	updated_at: Date;
}

export interface SystemPreferences {
	key: string;
	value: string;
	description: string;
	created_at: Date;
	updated_at: Date;
}
