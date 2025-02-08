import { Product, Order } from '../types';

// API base URL - replace with your actual API endpoint
const API_BASE_URL = 'http://localhost:41234';

// Products API
export const getProducts = async () => {
  const response = await fetch(`${API_BASE_URL}/product/`);
  if (!response.ok) throw new Error('Failed to fetch products');
  return response.json();
};

export const createProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
  console.log( 'PRODUCT: ', product);
  const response = await fetch(`${API_BASE_URL}/product/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error('Failed to create product');
  return response.json();
};

export const updateProduct = async (id: number, product: Partial<Product>) => {
  const response = await fetch(`${API_BASE_URL}/product/${id}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(product),
  });
  if (!response.ok) throw new Error('Failed to update product');
  return response.json();
};

export const deleteProduct = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/product/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Failed to delete product');
};

// Orders API
export const getOrders = async () => {
  const response = await fetch(`${API_BASE_URL}/order/`);
  if (!response.ok) throw new Error('Failed to fetch orders');
  return response.json();
};

export const updateOrderStatus = async (id: number, status: Order['status']) => {
  const response = await fetch(`${API_BASE_URL}/order/${id}/status`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  if (!response.ok) throw new Error('Failed to update order status');
  return response.json();
};

// Dashboard API
export const getDashboardStats = async () => {
  const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
  if (!response.ok) throw new Error('Failed to fetch dashboard stats');
  return response.json();
};