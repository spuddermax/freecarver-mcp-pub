import { ProductCategory, ProductCategoryAssignment } from "../../types/Interfaces";
import { formatProductCategory } from "../../utils/formatters";

/**
 * Fetch categories assigned to a product
 * @param productId The product ID to get categories for
 * @returns Array of product categories
 */
export async function fetchProductCategories(productId: string | number): Promise<ProductCategory[]> {
  try {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/products/${productId}/categories`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch product categories");
    }
    
    const data = await response.json();
    
    // Map the categories using the formatter
    const formattedCategories = data.data.categories.map((category: any) =>
      formatProductCategory(category)
    );
    
    return formattedCategories;
  } catch (error: any) {
    console.error("Error fetching product categories:", error);
    throw error;
  }
}

/**
 * Assign categories to a product
 * @param productId The product ID
 * @param categoryIds Array of category IDs to assign
 * @returns Success message
 */
export async function assignCategoriesToProduct(
  productId: string | number,
  categoryIds: number[]
): Promise<void> {
  try {
    const token = localStorage.getItem("jwtToken");
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/products/${productId}/categories`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category_ids: categoryIds })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to assign categories to product");
    }
  } catch (error: any) {
    console.error("Error assigning categories to product:", error);
    throw error;
  }
}

/**
 * Remove all category assignments from a product and assign new ones
 * @param productId The product ID
 * @param categoryIds Array of category IDs to assign
 * @returns Success message
 */
export async function updateProductCategories(
  productId: string | number,
  categoryIds: number[]
): Promise<void> {
  try {
    const token = localStorage.getItem("jwtToken");
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/products/${productId}/categories`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ category_ids: categoryIds })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update product categories");
    }
  } catch (error: any) {
    console.error("Error updating product categories:", error);
    throw error;
  }
}

/**
 * Remove a category assignment from a product
 * @param productId The product ID
 * @param categoryId The category ID to remove
 * @returns Success message
 */
export async function removeCategoryFromProduct(
  productId: string | number,
  categoryId: number
): Promise<void> {
  try {
    const token = localStorage.getItem("jwtToken");
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/products/${productId}/categories/${categoryId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to remove category from product");
    }
  } catch (error: any) {
    console.error("Error removing category from product:", error);
    throw error;
  }
} 