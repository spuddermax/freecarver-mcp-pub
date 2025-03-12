import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Folder as FolderIcon, Save as SaveIcon, Trash as TrashIcon, ArrowLeft as ArrowLeftIcon, Plus as PlusIcon, ChevronRight, Image as ImageIcon, X as XIcon } from "lucide-react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import { LoadingModal } from "../components/LoadingModal";
import { Modal } from "../components/Modal";
import { formatProductCategory } from "../utils/formatters";
import { ProductCategory } from "../types/Interfaces";
import { uploadCategoryHeroToCloudflare, deleteImageFromCloudflare } from "../lib/api";

export default function ProductCategoryEdit() {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!targetId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteImageConfirmOpen, setDeleteImageConfirmOpen] = useState(false);
  const [availableParentCategories, setAvailableParentCategories] = useState<ProductCategory[]>([]);
  const [categoryLineage, setCategoryLineage] = useState<ProductCategory[]>([]);
  
  const [category, setCategory] = useState<ProductCategory>({
    id: 0,
    name: "",
    description: "",
    parent_category_id: null,
    hero_image: null,
    created_at: new Date(),
    updated_at: new Date()
  });

  // New state for image upload handling
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

  // Handle image file selection
  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setImageFile(file);
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  // Clear selected image
  const clearSelectedImage = () => {
    setImageFile(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
  };

  // Trigger the delete image confirmation modal
  const confirmRemoveHeroImage = () => {
    setDeleteImageConfirmOpen(true);
  };

  // Remove existing hero image
  const removeHeroImage = async () => {
    setDeleteImageConfirmOpen(false);
    
    // If there's an existing hero image and we're editing a category
    if (category.hero_image && isEditing) {
      try {
        setIsUploading(true);
        // Delete the image from Cloudflare R2 storage
        await deleteImageFromCloudflare(
          category.hero_image,
          'category_hero',
          parseInt(targetId as string, 10)
        );
        
        // Set message to indicate success
        setMessage({ type: "success", text: "Hero image removed successfully" });
      } catch (error: any) {
        console.error("Error deleting hero image:", error);
        setMessage({ type: "error", text: `Failed to delete hero image: ${error.message}` });
      } finally {
        setIsUploading(false);
      }
    }
    
    // Update local state
    setCategory(prev => ({
      ...prev,
      hero_image: null
    }));
    clearSelectedImage();
  };

  // Update the upload image function
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || (!isEditing && !category.id)) return null;
    
    setIsUploading(true);
    try {
      // If editing an existing category, use the category ID
      // Otherwise, we'll handle this after creating the category
      const categoryId = isEditing ? parseInt(targetId as string, 10) : category.id;
      
      // Use the Cloudflare R2 upload function
      const response = await uploadCategoryHeroToCloudflare(
        imageFile,
        categoryId,
        category.hero_image || undefined
      );
      
      // The cloudflare-avatar endpoint will name the file user-{id}.{extension}
      // We need to use the URL as is, but later we might want to update the API to
      // handle different image types more directly
      const cloudflareUrl = response.data.publicUrl;
      
      return cloudflareUrl;
    } catch (error: any) {
      console.error("Error uploading hero image:", error);
      setMessage({ type: "error", text: `Failed to upload hero image: ${error.message}` });
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Update the submit handler to handle image upload
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      let heroImageUrl = category.hero_image;
      let needsImageUpload = !!imageFile;
      
      // For new categories, we need to create the category first, then upload the image
      // For existing categories, we can upload the image first
      if (isEditing && imageFile) {
        heroImageUrl = await uploadImage();
        needsImageUpload = false;
        
        if (!heroImageUrl && imageFile) {
          // If upload failed but we have a file, stop the save process
          setSaving(false);
          return;
        }
      }
      
      const token = localStorage.getItem("jwtToken");
      const url = isEditing 
        ? `${import.meta.env.VITE_API_URL}/v1/product_categories/${targetId}`
        : `${import.meta.env.VITE_API_URL}/v1/product_categories`;
      
      const method = isEditing ? 'PUT' : 'POST';
      
      // Create request body, omitting parent_category_id if null and including hero_image
      const requestBody: { 
        name: string; 
        description: string; 
        parent_category_id?: number | null;
        hero_image?: string | null;
      } = {
        name: category.name,
        description: category.description || "",
      };
      
      // Only include parent_category_id if it's not null
      if (category.parent_category_id !== null) {
        requestBody.parent_category_id = category.parent_category_id;
      }
      
      // Include hero_image (could be null to remove it, or we'll set it after upload for new categories)
      if (!needsImageUpload) {
        requestBody.hero_image = heroImageUrl;
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
      
      // For new categories with an image to upload
      if (!isEditing && needsImageUpload && imageFile) {
        const data = await response.json();
        const newId = data.data.category.id;
        
        // Now that we have the new category ID, upload the image
        const uploadedImageUrl = await uploadCategoryHeroToCloudflare(
          imageFile,
          newId,
          undefined
        );
        
        if (uploadedImageUrl && uploadedImageUrl.data.publicUrl) {
          // Update the category with the new image URL
          const updateResponse = await fetch(
            `${import.meta.env.VITE_API_URL}/v1/product_categories/${newId}`,
            {
              method: 'PUT',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ hero_image: uploadedImageUrl.data.publicUrl })
            }
          );
          
          if (updateResponse.ok) {
            heroImageUrl = uploadedImageUrl.data.publicUrl;
          }
        }
      }
      
      // Update local state with the new image URL if it was uploaded
      if (heroImageUrl !== category.hero_image) {
        setCategory(prev => ({
          ...prev,
          hero_image: heroImageUrl
        }));
      }
      
      setMessage({ 
        type: "success", 
        text: isEditing ? "Category updated successfully" : "Category created successfully" 
      });
      
      // Clear the selected file since it's been uploaded
      clearSelectedImage();
      
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
                
                {/* Hero Image Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Hero Image
                  </label>
                  
                  {/* Image Preview */}
                  {(imagePreview || category.hero_image) && (
                    <div className="relative mb-4">
                      <img 
                        src={imagePreview || category.hero_image || ''} 
                        alt="Category hero" 
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <button
                        type="button"
                        onClick={confirmRemoveHeroImage}
                        className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 focus:outline-none"
                        title="Remove image"
                      >
                        <XIcon className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  
                  {/* File Upload Input */}
                  {!imagePreview && !category.hero_image && (
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-md">
                      <div className="space-y-1 text-center">
                        <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600 dark:text-gray-400">
                          <label
                            htmlFor="hero-image-upload"
                            className="relative cursor-pointer bg-white dark:bg-gray-700 rounded-md font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 focus-within:outline-none"
                          >
                            <span>Upload an image</span>
                            <input
                              id="hero-image-upload"
                              name="hero-image-upload"
                              type="file"
                              accept="image/*"
                              onChange={handleImageChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          PNG, JPG, GIF up to 10MB
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* Change Image Button (if image already exists) */}
                  {(imagePreview || category.hero_image) && (
                    <div className="mt-2">
                      <label
                        htmlFor="hero-image-change"
                        className="cursor-pointer inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none"
                      >
                        <ImageIcon className="h-4 w-4 mr-2" />
                        Change Image
                        <input
                          id="hero-image-change"
                          name="hero-image-change"
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  )}
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
            
            {/* Hero Image Delete Confirmation Modal */}
            <Modal
              isOpen={deleteImageConfirmOpen}
              onClose={() => setDeleteImageConfirmOpen(false)}
              title="Confirm Delete Hero Image"
            >
              <div className="p-4">
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Are you sure you want to delete this hero image? This action cannot be undone and will permanently remove the image from storage.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setDeleteImageConfirmOpen(false)}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={removeHeroImage}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </Modal>
          </div>
        </div>
      </div>
    </Layout>
  );
} 