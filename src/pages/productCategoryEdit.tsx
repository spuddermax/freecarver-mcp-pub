import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Folder as FolderIcon, Save as SaveIcon, Trash as TrashIcon, ArrowLeft as ArrowLeftIcon, Plus as PlusIcon, ChevronRight } from "lucide-react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import { LoadingModal } from "../components/LoadingModal";
import { formatProductCategory } from "../utils/formatters";
import { ProductCategory } from "../types/Interfaces";

export default function ProductCategoryEdit() {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!targetId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [availableParentCategories, setAvailableParentCategories] = useState<ProductCategory[]>([]);
  const [categoryLineage, setCategoryLineage] = useState<ProductCategory[]>([]);
  
  const [category, setCategory] = useState<ProductCategory>({
    id: 0,
    name: "",
    description: "",
    parent_category_id: null,
    created_at: new Date(),
    updated_at: new Date()
  });

  useEffect(() => {
    // Always fetch all categories to populate the parent category dropdown
    fetchAllCategories();
    
    if (isEditing) {
      loadCategory();
    } else {
      // Check if the URL has a parentId query parameter
      const searchParams = new URLSearchParams(location.search);
      const parentId = searchParams.get('parentId');
      
      if (parentId) {
        setCategory(prev => ({
          ...prev,
          parent_category_id: parseInt(parentId, 10)
        }));
      }
      
      setLoading(false);
    }
  }, [targetId, location.search]);

  async function fetchAllCategories() {
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/product_categories?limit=1000`,
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
      
      setAvailableParentCategories(formattedCategories);
    } catch (error: any) {
      console.error("Error fetching parent categories:", error);
      // Handle silently, not critical
    }
  }

  async function loadCategory() {
    setLoading(true);
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/product_categories/${targetId}`,
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
      const loadedCategory = formatProductCategory(data.data.category);
      setCategory(loadedCategory);
      
      // Once the category is loaded, build its lineage if it has a parent
      if (loadedCategory.parent_category_id !== null) {
        await buildCategoryLineage(loadedCategory.parent_category_id);
      }
    } catch (error: any) {
      console.error("Error loading product category:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  // Function to build the category lineage
  const buildCategoryLineage = async (parentId: number) => {
    try {
      // First check if we already have all categories loaded
      if (availableParentCategories.length > 0) {
        const lineage: ProductCategory[] = [];
        let currentParentId: number | null = parentId;
        
        // Loop until we reach a top-level category
        while (currentParentId !== null) {
          const parentCategory = availableParentCategories.find(cat => cat.id === currentParentId);
          if (!parentCategory) break;
          
          lineage.unshift(parentCategory); // Add to the beginning of the array
          currentParentId = parentCategory.parent_category_id;
        }
        
        setCategoryLineage(lineage);
      } else {
        // If categories aren't loaded yet, fetch them one by one
        const token = localStorage.getItem("jwtToken");
        const lineage: ProductCategory[] = [];
        let currentParentId: number | null = parentId;
        
        while (currentParentId !== null) {
          const response = await fetch(
            `${import.meta.env.VITE_API_URL}/v1/product_categories/${currentParentId}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          
          if (response.ok) {
            const data = await response.json();
            const parentCategory = formatProductCategory(data.data.category);
            lineage.unshift(parentCategory);
            currentParentId = parentCategory.parent_category_id;
          } else {
            break;
          }
        }
        
        setCategoryLineage(lineage);
      }
    } catch (error) {
      console.error("Error building category lineage:", error);
      // Handle silently, not critical
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setCategory(prev => ({
      ...prev,
      [name]: name === 'parent_category_id' && value === 'null' ? null : 
              name === 'parent_category_id' ? parseInt(value, 10) : 
              value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const token = localStorage.getItem("jwtToken");
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL}/v1/product_categories/${targetId}`
        : `${import.meta.env.VITE_API_URL}/v1/product_categories`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Create request body, omitting parent_category_id if null
      const requestBody: { name: string; description: string; parent_category_id?: number | null } = {
        name: category.name,
        description: category.description || "",
      };
      
      // Only include parent_category_id if it's not null
      if (category.parent_category_id !== null) {
        requestBody.parent_category_id = category.parent_category_id;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save product category");
      }
      
      setMessage({ 
        type: "success", 
        text: isEditing ? "Category updated successfully" : "Category created successfully" 
      });
      
      // For new categories, navigate to the edit page after creation
      if (!isEditing) {
        const data = await response.json();
        const newId = data.data.category.id;
        
        // Wait a moment before redirecting to allow the success message to be seen
        setTimeout(() => {
          navigate(`/productCategoryEdit/${newId}`, { replace: true });
        }, 1500);
      }
    } catch (error: any) {
      console.error("Error saving product category:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing || !targetId) return;
    
    setSaving(true);
    
    try {
      const token = localStorage.getItem("jwtToken");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/v1/product_categories/${targetId}`,
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
      
      setMessage({ type: "success", text: "Category deleted successfully" });
      
      // Navigate back to categories list
      setTimeout(() => {
        navigate('/productCategories');
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting product category:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
      setDeleteConfirmOpen(false);
    }
  };

  // Filter out the current category from parent options to prevent self-reference
  const parentCategoryOptions = availableParentCategories.filter(
    cat => !isEditing || cat.id !== parseInt(targetId as string, 10)
  );

  // Add function to handle creating a sub-category
  const handleAddSubCategory = () => {
    if (!isEditing || !targetId) return;
    navigate(`/productCategoryEdit?parentId=${targetId}`);
  };

  return (
    <Layout
      pageInfo={{
        title: isEditing ? "Edit Product Category" : "Create Product Category",
        icon: FolderIcon,
        iconColor: "text-green-600 dark:text-green-500",
      }}
      breadcrumbs={[
        { label: "Dashboard", link: "/dashboard" },
        { label: "Product Categories", link: "/productCategories" },
        { label: isEditing ? "Edit Category" : "New Category" },
      ]}
    >
      {message && (
        <Toast
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}
      
      <LoadingModal isOpen={loading} message="Loading category..." />
      <LoadingModal isOpen={saving} message={isEditing ? "Saving category..." : "Creating category..."} />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            {/* Category Lineage Breadcrumbs */}
            {isEditing && categoryLineage.length > 0 && (
              <div className="mb-4 text-xs text-gray-500 dark:text-gray-400 flex items-center flex-wrap">
                <span className="mr-1">Parent Lineage:</span>
                {categoryLineage.map((parent, index) => (
                  <div key={parent.id} className="flex items-center">
                    <button 
                      onClick={() => navigate(`/productCategoryEdit/${parent.id}`)}
                      className="hover:text-green-600 dark:hover:text-green-400 hover:underline font-medium"
                    >
                      {parent.name}
                    </button>
                    {index < categoryLineage.length - 1 && (
                      <ChevronRight className="h-3 w-3 mx-1" />
                    )}
                  </div>
                ))}
                <ChevronRight className="h-3 w-3 mx-1" />
                <span className="font-medium text-green-600 dark:text-green-400">{category.name}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? `Edit Category: ${category.name}` : "Create New Category"}
              </h2>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => navigate('/productCategories')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <ArrowLeftIcon className="h-4 w-4 mr-2" />
                  Back to Categories
                </button>
                
                {isEditing && (
                  <button
                    onClick={handleAddSubCategory}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Sub-Category
                  </button>
                )}
                
                <button
                  onClick={handleSubmit}
                  disabled={saving || loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {isEditing ? "Update Category" : "Create Category"}
                </button>
                
                {isEditing && (
                  <button
                    onClick={() => setDeleteConfirmOpen(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={category.name}
                    onChange={handleInputChange}
                    required
                    className="mt-1 block w-full border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="Enter category name"
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Description
                  </label>
                  <textarea
                    name="description"
                    id="description"
                    value={category.description || ""}
                    onChange={handleInputChange}
                    rows={3}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                    placeholder="Enter category description (optional)"
                  />
                </div>
                
                <div>
                  <label htmlFor="parent_category_id" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Parent Category
                  </label>
                  <select
                    name="parent_category_id"
                    id="parent_category_id"
                    value={category.parent_category_id === null ? 'null' : category.parent_category_id}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500 sm:text-sm dark:bg-gray-700 dark:text-white"
                  >
                    <option value="null">None (Top-Level Category)</option>
                    {parentCategoryOptions.map(parentCat => (
                      <option key={parentCat.id} value={parentCat.id}>
                        {parentCat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </form>
            
            {/* Delete Confirmation Modal */}
            {deleteConfirmOpen && (
              <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-xl max-w-md w-full">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Confirm Delete</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6">
                    Are you sure you want to delete the category "{category.name}"? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setDeleteConfirmOpen(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDelete}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 