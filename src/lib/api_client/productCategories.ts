import { ProductCategory } from "../../types/Interfaces";
import { formatProductCategory } from "../../utils/formatters";
import { deleteImageFromCloudflare, uploadCategoryHeroToCloudflare } from "../api";

/**
 * Fetch all product categories
 * @param limit Optional limit parameter (default: 1000)
 * @returns Formatted category objects
 */
export async function fetchAllCategories(limit: number = 1000): Promise<ProductCategory[]> {
  try {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/product_categories?limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch parent categories");
    }
    const data = await response.json();
    
    // Map the categories using the formatter
    const formattedCategories = data.data.categories.map((category: any) =>
      formatProductCategory(category)
    );
    
    return formattedCategories;
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    throw error;
  }
}

/**
 * Load a specific product category by ID
 * @param categoryId The ID of the category to load
 * @returns The formatted category object
 */
export async function fetchCategoryById(categoryId: string): Promise<ProductCategory> {
  try {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/product_categories/${categoryId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch product category");
    }
    const data = await response.json();
    return formatProductCategory(data.data.category);
  } catch (error: any) {
    console.error("Error loading product category:", error);
    throw error;
  }
}

/**
 * Fetch a parent category by ID
 * Used for building category lineage
 * @param parentId The ID of the parent category
 * @returns The formatted parent category
 */
export async function fetchParentCategory(parentId: number): Promise<ProductCategory> {
  try {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/product_categories/${parentId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    if (!response.ok) {
      throw new Error("Failed to fetch parent category");
    }
    
    const data = await response.json();
    return formatProductCategory(data.data.category);
  } catch (error: any) {
    console.error("Error fetching parent category:", error);
    throw error;
  }
}

/**
 * Upload a hero image for a category
 * @param file The image file to upload
 * @param categoryId The ID of the category
 * @param currentImageUrl Optional current image URL to replace
 * @returns The URL of the uploaded image
 */
export async function uploadCategoryHeroImage(
  file: File,
  categoryId: number,
  currentImageUrl?: string
): Promise<string> {
  try {
    const response = await uploadCategoryHeroToCloudflare(
      file,
      categoryId,
      currentImageUrl
    );
    
    return response.data.publicUrl;
  } catch (error: any) {
    console.error("Error uploading hero image:", error);
    throw error;
  }
}

/**
 * Remove a hero image from a category
 * @param imageUrl The URL of the image to delete
 * @param categoryId The ID of the category
 */
export async function removeCategoryHeroImage(
  imageUrl: string,
  categoryId: number
): Promise<void> {
  try {
    await deleteImageFromCloudflare(
      imageUrl,
      'category_hero',
      categoryId
    );
  } catch (error: any) {
    console.error("Error deleting hero image:", error);
    throw error;
  }
}

/**
 * Create a new product category
 * @param category The category data to create
 * @returns The created category data including ID
 */
export async function createCategory(
  category: {
    name: string;
    description: string;
    parent_category_id?: number | null;
    hero_image?: string | null;
  }
): Promise<{ id: number; [key: string]: any }> {
  try {
    const token = localStorage.getItem("jwtToken");
    
    const requestBody: { 
      name: string; 
      description: string; 
      parent_category_id?: number | null;
      hero_image?: string | null;
    } = {
      name: category.name,
      description: category.description || "",
    };
    
    if (category.parent_category_id !== null && category.parent_category_id !== undefined) {
      requestBody.parent_category_id = category.parent_category_id;
    }
    
    if (category.hero_image !== undefined) {
      requestBody.hero_image = category.hero_image;
    }
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/product_categories`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create product category");
    }
    
    const data = await response.json();
    return data.data.category;
  } catch (error: any) {
    console.error("Error creating category:", error);
    throw error;
  }
}

/**
 * Update an existing product category
 * @param categoryId The ID of the category to update
 * @param category The category data to update
 */
export async function updateCategory(
  categoryId: string | number,
  category: {
    name: string;
    description: string;
    parent_category_id?: number | null;
    hero_image?: string | null;
  }
): Promise<void> {
  try {
    const token = localStorage.getItem("jwtToken");
    
    const requestBody: { 
      name: string; 
      description: string; 
      parent_category_id?: number | null;
      hero_image?: string | null;
    } = {
      name: category.name,
      description: category.description || "",
    };
    
    if (category.parent_category_id !== null && category.parent_category_id !== undefined) {
      requestBody.parent_category_id = category.parent_category_id;
    }
    
    if (category.hero_image !== undefined) {
      requestBody.hero_image = category.hero_image;
    }
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/product_categories/${categoryId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update product category");
    }
  } catch (error: any) {
    console.error("Error updating category:", error);
    throw error;
  }
}

/**
 * Update only the hero image of a category
 * @param categoryId The ID of the category
 * @param heroImageUrl The URL of the hero image
 */
export async function updateCategoryHeroImage(
  categoryId: string | number,
  heroImageUrl: string | null
): Promise<void> {
  try {
    const token = localStorage.getItem("jwtToken");
    
    // First fetch the current category data to get the name
    const currentCategory = await fetchCategoryById(categoryId.toString());
    
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/product_categories/${categoryId}`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // Include the name field to satisfy validation requirements
        body: JSON.stringify({ 
          name: currentCategory.name,
          hero_image: heroImageUrl 
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update category hero image");
    }
  } catch (error: any) {
    console.error("Error updating category hero image:", error);
    throw error;
  }
}

/**
 * Delete a product category
 * @param categoryId The ID of the category to delete
 */
export async function deleteCategory(categoryId: string | number): Promise<void> {
  try {
    const token = localStorage.getItem("jwtToken");
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/v1/product_categories/${categoryId}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete product category");
    }
  } catch (error: any) {
    console.error("Error deleting category:", error);
    throw error;
  }
}
