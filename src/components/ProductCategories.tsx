import { useState, useEffect, useMemo } from "react";
import { Tag, Folder, Save, X, Search, Plus, ChevronRight } from "lucide-react";
import { fetchAllCategories } from "../lib/api_client/productCategories";
import { 
  fetchProductCategories,
  updateProductCategories 
} from "../lib/api_client/productCategoryAssignments";
import { Product, ProductCategory } from "../types/Interfaces";
import { Toast } from "../components/Toast";
import { LoadingModal } from "../components/LoadingModal";

export interface ProductCategoriesProps {
  product: Product;
  onCategoriesChange?: (categoryIds: number[]) => void;
}

export function ProductCategories({ product, onCategoriesChange }: ProductCategoriesProps) {
  // States for categories
  const [availableCategories, setAvailableCategories] = useState<ProductCategory[]>([]);
  const [assignedCategories, setAssignedCategories] = useState<ProductCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [originalCategoryIds, setOriginalCategoryIds] = useState<number[]>([]);
  
  // Toast state
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Load all available categories and assigned categories when the component mounts
  useEffect(() => {
    const fetchCategories = async () => {
      setLoading(true);
      try {
        // Fetch all available categories
        const allCategories = await fetchAllCategories();
        setAvailableCategories(allCategories);
        
        // Fetch categories assigned to this product
        if (product.id) {
          const productCategories = await fetchProductCategories(product.id);
          setAssignedCategories(productCategories);
          
          // Store original category IDs for comparison
          const categoryIds = productCategories.map(cat => cat.id);
          setOriginalCategoryIds(categoryIds);
        }
      } catch (error: any) {
        console.error("Error fetching categories:", error);
        setToast({
          message: `Error loading categories: ${error.message}`,
          type: "error"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
  }, [product.id]);

  // Calculate if there are unsaved changes
  const hasChanges = useMemo(() => {
    const currentCategoryIds = assignedCategories.map(cat => cat.id).sort();
    const original = [...originalCategoryIds].sort();
    
    return JSON.stringify(currentCategoryIds) !== JSON.stringify(original);
  }, [assignedCategories, originalCategoryIds]);

  // Filter available categories based on search term
  const filteredCategories = useMemo(() => {
    if (!searchTerm) return availableCategories;
    
    return availableCategories.filter(category => 
      category.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [availableCategories, searchTerm]);

  // Handle adding a category to the product
  const handleAddCategory = (category: ProductCategory) => {
    // Check if category is already assigned
    if (!assignedCategories.some(cat => cat.id === category.id)) {
      setAssignedCategories(prev => [...prev, category]);
    }
  };

  // Handle removing a category from the product
  const handleRemoveCategory = (categoryId: number) => {
    setAssignedCategories(prev => prev.filter(cat => cat.id !== categoryId));
  };

  // Save category assignments
  const handleSaveCategories = async () => {
    if (!product.id) return;
    
    setSaving(true);
    try {
      const categoryIds = assignedCategories.map(cat => cat.id);
      
      // Call API to update product categories
      await updateProductCategories(product.id, categoryIds);
      
      // Update original category IDs after successful save
      setOriginalCategoryIds(categoryIds);
      
      // Call the onCategoriesChange callback if provided
      if (onCategoriesChange) {
        onCategoriesChange(categoryIds);
      }
      
      setToast({
        message: "Product categories updated successfully.",
        type: "success"
      });
    } catch (error: any) {
      console.error("Error saving product categories:", error);
      setToast({
        message: `Error updating product categories: ${error.message}`,
        type: "error"
      });
    } finally {
      setSaving(false);
    }
  };

  // Group categories by parent for hierarchical display
  const getCategoryHierarchy = (category: ProductCategory): ProductCategory[] => {
    const hierarchy: ProductCategory[] = [category];
    let currentParentId = category.parent_category_id;
    
    // Prevent infinite loops from circular references
    const processedIds = new Set<number>([category.id]);
    
    while (currentParentId) {
      const parent = availableCategories.find(cat => cat.id === currentParentId);
      if (parent && !processedIds.has(parent.id)) {
        hierarchy.unshift(parent);
        processedIds.add(parent.id);
        currentParentId = parent.parent_category_id;
      } else {
        // Break if parent not found or circular reference detected
        break;
      }
    }
    
    return hierarchy;
  };

  return (
    <fieldset className="border rounded-lg p-4 border-green-200 dark:border-green-700">
      <legend className="text-2xl font-medium text-gray-700 dark:text-gray-300 px-2">
        Categories
      </legend>
      
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}
      
      <LoadingModal isOpen={loading} message="Loading categories..." />
      
      <div className="space-y-4">
        {/* Assigned Categories Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Assigned Categories
          </h3>
          
          {assignedCategories.length === 0 ? (
            <div className="text-sm text-gray-500 dark:text-gray-400 italic">
              No categories assigned yet
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {assignedCategories.map(category => {
                const hierarchy = getCategoryHierarchy(category);
                
                return (
                  <div 
                    key={category.id} 
                    className="inline-flex items-center bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-md text-sm"
                  >
                    <div className="flex items-center px-2 py-1">
                      <Tag className="h-4 w-4 mr-1" />
                      <span className="whitespace-nowrap">
                        {hierarchy.map((cat, index) => (
                          <span key={cat.id} className="inline-flex items-center">
                            {index > 0 && <ChevronRight className="h-3 w-3 mx-1" />}
                            <span>{cat.name}</span>
                          </span>
                        ))}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(category.id)}
                      className="group p-1 rounded-r-md hover:bg-green-200 dark:hover:bg-green-800"
                    >
                      <X className="h-4 w-4 group-hover:text-green-700 dark:group-hover:text-green-300" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Category Search Section */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add Categories
          </h3>
          
          <div className="relative mb-4">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search categories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500 dark:bg-gray-700 dark:text-white text-gray-700"
            />
          </div>
          
          <div className="max-h-60 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
            {filteredCategories.length === 0 ? (
              <div className="p-4 text-sm text-gray-500 dark:text-gray-400 italic">
                No categories found
              </div>
            ) : (
              <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredCategories.map(category => {
                  const isAssigned = assignedCategories.some(cat => cat.id === category.id);
                  const hierarchy = getCategoryHierarchy(category);
                  
                  return (
                    <li key={category.id} className="px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-800">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center text-sm">
                          <Folder className="h-4 w-4 mr-2 text-green-600 dark:text-green-400" />
                          <span>
                            {hierarchy.map((cat, index) => (
                              <span key={cat.id} className="inline-flex items-center">
                                {index > 0 && <ChevronRight className="h-3 w-3 mx-1 text-gray-400" />}
                                <span 
                                  className={cat.id === category.id ? "font-medium" : "text-gray-500 dark:text-gray-400"}
                                >
                                  {cat.name}
                                </span>
                              </span>
                            ))}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleAddCategory(category)}
                          disabled={isAssigned}
                          className={`inline-flex items-center px-2 py-1 text-xs rounded 
                            ${isAssigned 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' 
                              : 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-800'
                            }`}
                        >
                          {isAssigned ? (
                            <span>Added</span>
                          ) : (
                            <>
                              <Plus className="h-3 w-3 mr-1" />
                              <span>Add</span>
                            </>
                          )}
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end pt-4">
          <button
            type="button"
            onClick={handleSaveCategories}
            disabled={!hasChanges || saving}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
              ${!hasChanges || saving
                ? 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'
                : 'bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
              }`}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? "Saving..." : "Save Categories"}
          </button>
        </div>
      </div>
    </fieldset>
  );
} 