import { useState, useEffect, ChangeEvent, FormEvent, useMemo, useRef } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { Folder as FolderIcon, Save as SaveIcon, Trash as TrashIcon, Plus as PlusIcon, ChevronRight, Image as ImageIcon, X as XIcon, AlertCircle as AlertCircleIcon, RotateCcw as RotateCcwIcon } from "lucide-react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import { LoadingModal } from "../components/LoadingModal";
import { Modal } from "../components/Modal";
import { ProductCategory } from "../types/Interfaces";
import {
  fetchAllCategories,
  fetchCategoryById,
  fetchParentCategory,
  uploadCategoryHeroImage,
  removeCategoryHeroImage,
  createCategory,
  updateCategory,
  updateCategoryHeroImage,
  deleteCategory
} from "../lib/api_client/productCategories";
import PulseUpdateButton, { pulseAnimationCSS } from "../components/PulseUpdateButton";
import { ImageUpload } from '../components/ImageUpload';

export default function ProductCategoryEdit() {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = !!targetId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteImageConfirmOpen, setDeleteImageConfirmOpen] = useState(false);
  const [availableParentCategories, setAvailableParentCategories] = useState<ProductCategory[]>([]);
  const [categoryLineage, setCategoryLineage] = useState<ProductCategory[]>([]);
  
  // Add state to track original category data for comparison
  const [originalCategory, setOriginalCategory] = useState<ProductCategory | null>(null);
  
  // Add state to track if image was recently uploaded
  const [imageJustUploaded, setImageJustUploaded] = useState(false);
  
  // Add state to track if we just navigated from category creation
  const [justCreated, setJustCreated] = useState(false);
  
  // Add state to track if category has children
  const [hasChildren, setHasChildren] = useState(false);
  
  // Add state to track the children categories
  const [childrenCategories, setChildrenCategories] = useState<ProductCategory[]>([]);
  
  // Add state and ref to track if the update button is visible
  const updateButtonRef = useRef<HTMLDivElement>(null);
  const [isUpdateButtonVisible, setIsUpdateButtonVisible] = useState(true);
  
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
  
  // Calculate if there are any changes compared to original data
  const hasChanges = useMemo(() => {
    // If we just created and navigated to this page, don't show changes
    if (justCreated) return false;
    
    if (!isEditing || !originalCategory) return true; // For new categories or while loading, allow submission
    
    // Compare basic fields
    if (category.name !== originalCategory.name) return true;
    if (category.description !== originalCategory.description) return true;
    if (category.parent_category_id !== originalCategory.parent_category_id) return true;
    
    // Check if image file is selected but not yet uploaded
    if (imageFile && !imageJustUploaded) return true;
    
    // If we just uploaded an image and there are no other changes, don't consider it a change
    if (imageJustUploaded && 
        category.name === originalCategory.name && 
        category.description === originalCategory.description && 
        category.parent_category_id === originalCategory.parent_category_id) {
      return false;
    }
    
    // Check if hero_image field has changed (for cases where it was removed)
    if (category.hero_image !== originalCategory.hero_image) {
      return true;
    }
    
    return false;
  }, [category, originalCategory, imageFile, isEditing, imageJustUploaded, justCreated]);
  
  // Function to generate list of changes
  const getChangesDescription = useMemo(() => {
    if (!isEditing || !originalCategory) return [];
    
    const changes: string[] = [];
    
    // Check basic fields
    if (category.name !== originalCategory.name) {
      changes.push(`Name: "${originalCategory.name}" → "${category.name}"`);
    }
    
    if (category.description !== originalCategory.description) {
      const oldDesc = originalCategory.description || '(empty)';
      const newDesc = category.description || '(empty)';
      if (oldDesc !== newDesc) {
        changes.push(`Description: changed`);
      }
    }
    
    // Check parent category
    if (category.parent_category_id !== originalCategory.parent_category_id) {
      const oldParentName = originalCategory.parent_category_id ? 
        availableParentCategories.find(cat => cat.id === originalCategory.parent_category_id)?.name || 'Unknown' : 
        'None';
      
      const newParentName = category.parent_category_id ? 
        availableParentCategories.find(cat => cat.id === category.parent_category_id)?.name || 'Unknown' : 
        'None';
      
      changes.push(`Parent: "${oldParentName}" → "${newParentName}"`);
    }
    
    // Check hero image
    if (imageFile && !imageJustUploaded) {
      changes.push(`Hero Image: new image selected`);
    } else if (category.hero_image !== originalCategory.hero_image) {
      if (!category.hero_image) {
        changes.push(`Hero Image: removed`);
      } else if (!originalCategory.hero_image) {
        changes.push(`Hero Image: added`);
      } else {
        changes.push(`Hero Image: changed`);
      }
    }
    
    return changes;
  }, [category, originalCategory, imageFile, imageJustUploaded, availableParentCategories, isEditing]);

  // Calculate if button should pulse (enabled and has changes)
  const shouldPulse = useMemo(() => {
    // Never pulse if we just created the category
    if (justCreated) return false;
    
    // For new categories, only pulse if a name is provided
    if (!isEditing) return category.name.trim() !== '';
    
    // For existing categories, pulse if there are changes and not in a loading state
    return hasChanges && !saving && !loading && !isUploading;
  }, [hasChanges, saving, loading, isUploading, isEditing, category.name, justCreated]);

  useEffect(() => {
    // Always fetch all categories to populate the parent category dropdown
    fetchAllCategoriesData();
    
    if (isEditing) {
      loadCategoryData();
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

  // Update function to use API client
  async function fetchAllCategoriesData() {
    try {
      const formattedCategories = await fetchAllCategories();
      setAvailableParentCategories(formattedCategories);
    } catch (error: any) {
      console.error("Error fetching parent categories:", error);
      // Handle silently, not critical
    }
  }

  // Update function to use API client
  async function loadCategoryData() {
    setLoading(true);
    try {
      // Reset the category lineage to avoid showing stale data during navigation
      setCategoryLineage([]);
      
      const loadedCategory = await fetchCategoryById(targetId as string);
      
      // Store both current and original state
      setCategory(loadedCategory);
      setOriginalCategory(loadedCategory);
      
      // Once the category is loaded, build its lineage if it has a parent
      if (loadedCategory.parent_category_id !== null) {
        await buildCategoryLineage(loadedCategory.parent_category_id);
      }
      
      // Check if the category has any children
      await checkHasChildren(parseInt(targetId as string, 10));
    } catch (error: any) {
      console.error("Error loading product category:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  // Update function to use API client
  const buildCategoryLineage = async (parentId: number) => {
    try {
      // First check if we already have all categories loaded
      if (availableParentCategories.length > 0) {
        const lineage: ProductCategory[] = [];
        let currentParentId: number | null = parentId;
        
        // Keep track of categories we've already processed to avoid circular references
        const processedIds = new Set<number>();
        
        // Loop until we reach a top-level category
        while (currentParentId !== null) {
          // Check for circular reference
          if (processedIds.has(currentParentId)) {
            console.error("Circular reference detected in category lineage");
            break;
          }
          
          processedIds.add(currentParentId);
          
          const parentCategory = availableParentCategories.find(cat => cat.id === currentParentId);
          if (!parentCategory) break;
          
          lineage.unshift(parentCategory); // Add to the beginning of the array
          currentParentId = parentCategory.parent_category_id;
        }
        
        setCategoryLineage(lineage);
      } else {
        // If categories aren't loaded yet, fetch them one by one
        const lineage: ProductCategory[] = [];
        let currentParentId: number | null = parentId;
        
        // Keep track of categories we've already processed to avoid circular references
        const processedIds = new Set<number>();
        
        while (currentParentId !== null) {
          // Check for circular reference
          if (processedIds.has(currentParentId)) {
            console.error("Circular reference detected in category lineage");
            break;
          }
          
          processedIds.add(currentParentId);
          
          try {
            const parentCategory = await fetchParentCategory(currentParentId);
            lineage.unshift(parentCategory);
            currentParentId = parentCategory.parent_category_id;
          } catch (error) {
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
    // Clear the "just created" state when user makes changes
    setJustCreated(false);
    
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
    // Clear the "just created" state when user selects an image
    setJustCreated(false);
    
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
      // Check file size - 2MB limit
      const fileSize = file.size;
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      
      if (fileSize > maxSize) {
        // Show error message
        setMessage({
          type: "error",
          text: "Image is too large. Maximum size is 2MB."
        });
        
        // Reset the file input
        e.target.value = '';
        return;
      }
      
      setImageFile(file);
      setImageJustUploaded(false); // Reset the flag when a new image is selected
      
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

  // Update function to use API client
  const removeHeroImage = async () => {
    setDeleteImageConfirmOpen(false);
    
    // If there's an existing hero image and we're editing a category
    if (category.hero_image && isEditing) {
      try {
        setIsUploading(true);
        // Delete the image using the API client
        await removeCategoryHeroImage(
          category.hero_image,
          parseInt(targetId as string, 10)
        );
        
        // Set message to indicate success
        setMessage({ type: "success", text: "Hero image removed successfully" });
        setImageJustUploaded(false); // Reset flag when image is removed
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
    // Also update originalCategory to reflect this change is already saved
    setOriginalCategory(prev => {
      if (!prev) return null;
      return {
        ...prev,
        hero_image: null
      };
    });
    clearSelectedImage();
  };

  // Update function to use API client
  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile || (!isEditing && !category.id)) return null;
    
    // Double-check file size before uploading
    const maxSize = 2 * 1024 * 1024; // 2MB in bytes
    if (imageFile.size > maxSize) {
      setMessage({
        type: "error",
        text: "Image is too large. Maximum size is 2MB."
      });
      return null;
    }
    
    setIsUploading(true);
    try {
      // If editing an existing category, use the category ID
      // Otherwise, we'll handle this after creating the category
      const categoryId = isEditing ? parseInt(targetId as string, 10) : category.id;
      
      // Use the API client function
      const cloudflareUrl = await uploadCategoryHeroImage(
        imageFile,
        categoryId,
        category.hero_image || undefined
      );
      
      // Update both category and originalCategory to reflect this change is already saved
      if (isEditing) {
        setCategory(prev => ({
          ...prev,
          hero_image: cloudflareUrl
        }));
        setOriginalCategory(prev => {
          if (!prev) return null;
          return {
            ...prev,
            hero_image: cloudflareUrl
          };
        });
        
        // Set flag to indicate image was just uploaded
        setImageJustUploaded(true);
        // Clear the file reference since it's been uploaded
        clearSelectedImage();
      }
      
      return cloudflareUrl;
    } catch (error: any) {
      console.error("Error uploading hero image:", error);
      setMessage({ type: "error", text: `Failed to upload hero image: ${error.message}` });
      setImageJustUploaded(false);
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  // Update function to use API client
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    // If we're just uploading an image
    if (isEditing && imageFile && !hasChanges) {
      await uploadImage();
      return;
    }
    
    setSaving(true);
    
    try {
      let heroImageUrl = category.hero_image;
      let needsImageUpload = isEditing && !!imageFile;
      
      // For new categories, we need to create the category first, then upload the image
      // For existing categories, we can upload the image first
      if (isEditing && imageFile && !imageJustUploaded) {
        heroImageUrl = await uploadImage();
        needsImageUpload = false;
        
        if (!heroImageUrl && imageFile) {
          // If upload failed but we have a file, stop the save process
          setSaving(false);
          return;
        }
      }
      
      // Check if only the hero_image has changed
      const onlyHeroImageChanged = isEditing && 
        originalCategory && 
        category.name === originalCategory.name && 
        category.description === originalCategory.description && 
        category.parent_category_id === originalCategory.parent_category_id && 
        category.hero_image !== originalCategory.hero_image;
      
      if (isEditing && onlyHeroImageChanged) {
        // Use the dedicated function for updating hero images
        try {
          await updateCategoryHeroImage(targetId as string, heroImageUrl);
          
          // Verify the update
          setTimeout(async () => {
            try {
              const updatedCategory = await fetchCategoryById(targetId as string);
              
              // If still not updated, try a direct API call as a last resort
              if (category.hero_image !== updatedCategory.hero_image) {
                try {
                  const token = localStorage.getItem("jwtToken");
                  const directResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/v1/product_categories/${targetId}`,
                    {
                      method: 'PUT',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                      },
                      body: JSON.stringify({
                        name: category.name,
                        description: category.description || "",
                        parent_category_id: category.parent_category_id !== null ? category.parent_category_id : undefined,
                        hero_image: heroImageUrl
                      })
                    }
                  );
                  
                  setTimeout(async () => {
                    const finalCheckCategory = await fetchCategoryById(targetId as string);
                  }, 1000);
                } catch (directError) {
                  console.error('DEBUG: Direct fetch error:', directError);
                }
              }
            } catch (error) {
              console.error('DEBUG: Error fetching category after hero image update:', error);
            }
          }, 1000);
          
          // Update the original category to reflect the change
          setOriginalCategory(prev => {
            if (!prev) return null;
            return {
              ...prev,
              hero_image: heroImageUrl
            };
          });
          
          setMessage({ 
            type: "success", 
            text: "Hero image updated successfully" 
          });
          setSaving(false);
          return;
        } catch (heroUpdateError) {
          console.error('DEBUG: Hero image update failed:', heroUpdateError);
          // Continue with normal update as fallback
        }
      }
      
      // Standard update path for other changes
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
      
      // Always include hero_image in the request body
      // This ensures that URL changes are sent to the server
      requestBody.hero_image = heroImageUrl;
      
      if (isEditing) {
        // Update existing category
        try {
          await updateCategory(targetId as string, requestBody);
        } catch (updateError) {
          console.error('DEBUG: Update category failed with error:', updateError);
        }
      } else {
        // Create new category (without hero image)
        const newCategory = await createCategory(requestBody);
        
        // Set a flag in sessionStorage to indicate we're coming from creation
        sessionStorage.setItem("categoryJustCreated", "true");
        
        // Navigate to the edit page for the newly created category
        setMessage({ 
          type: "success", 
          text: "Category created successfully" 
        });
        
        // Use setTimeout to ensure the message is shown before redirecting
        setTimeout(() => {
          navigate(`/productCategoryEdit/${newCategory.id}`);
        }, 500);
        
        setSaving(false);
        return; // Exit early as we're navigating away
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
      
      // For existing categories, update the originalCategory after a successful save
      if (isEditing) {
        setOriginalCategory(prev => {
          if (!prev) return null;
          return {
            ...category,
            hero_image: heroImageUrl || null
          };
        });
        setImageJustUploaded(false); // Reset the flag after save
      }
    } catch (error: any) {
      console.error("Error saving product category:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  // Update function to use API client
  const handleDelete = async () => {
    if (!isEditing || !targetId) return;
    
    setDeleting(true);
    
    try {
      // First check if the category has a hero image and delete it if it exists
      if (category.hero_image) {
        try {
          // Delete the hero image from Cloudflare
          await removeCategoryHeroImage(
            category.hero_image,
            parseInt(targetId as string, 10)
          );
          console.log("Hero image deleted from Cloudflare");
        } catch (imageError: any) {
          console.error("Error deleting hero image:", imageError);
          // Continue with category deletion even if image deletion fails
        }
      }
      
      // Now delete the category
      await deleteCategory(targetId);
      
      setMessage({ 
        type: "success", 
        text: category.hero_image 
          ? "Category and its hero image deleted successfully" 
          : "Category deleted successfully" 
      });
      
      // Navigate back to categories list
      setTimeout(() => {
        navigate('/productCategories');
      }, 1500);
    } catch (error: any) {
      console.error("Error deleting product category:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setDeleting(false);
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

  // Add function to revert changes
  const handleRevertChanges = () => {
    if (!originalCategory) return;
    
    // Revert the category back to its original state
    setCategory({...originalCategory});
    
    // Clear any selected image file
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImageFile(null);
    setImagePreview(null);
    setImageJustUploaded(false);
    
    // Show a message to confirm changes were reverted
    setMessage({
      type: "success",
      text: "All changes have been reverted"
    });
  };

  // Check sessionStorage on load to see if we're coming from a creation
  useEffect(() => {
    if (isEditing && sessionStorage.getItem("categoryJustCreated") === "true") {
      setJustCreated(true);
      // Remove the flag from sessionStorage so it doesn't affect future loads
      sessionStorage.removeItem("categoryJustCreated");
    }
  }, [isEditing]);

  // Update the function to both check for children and store them
  const checkHasChildren = async (categoryId: number) => {
    try {
      // Fetch all categories
      const allCategories = await fetchAllCategories();
      
      // Filter categories that have this category as parent
      const children = allCategories.filter(
        cat => cat.parent_category_id === categoryId
      );
      
      setHasChildren(children.length > 0);
      setChildrenCategories(children);
    } catch (error) {
      console.error("Error checking for category children:", error);
      // Default to false and empty array if check fails
      setHasChildren(false);
      setChildrenCategories([]);
    }
  };

  // Set up observer for update button visibility
  useEffect(() => {
    if (!updateButtonRef.current) return;
    
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          setIsUpdateButtonVisible(entry.isIntersecting);
        });
      },
      { root: null, threshold: 0.1 }
    );
    
    observer.observe(updateButtonRef.current);
    
    return () => {
      if (updateButtonRef.current) {
        observer.unobserve(updateButtonRef.current);
      }
    };
  }, []);

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
      {/* Add the CSS animation to the head */}
      <style>{pulseAnimationCSS}</style>
      
      {message && (
        <Toast
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}
      
      <LoadingModal isOpen={loading} message="Loading category..." />
      <LoadingModal isOpen={saving} message={isEditing ? "Saving category..." : "Creating category..."} />
      <LoadingModal isOpen={deleting} message={category.hero_image ? "Deleting hero image and category..." : "Deleting category..."} />
      
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
                
                {/* Hero Image Section - Only show when editing */}
                {isEditing && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Hero Image
                    </label>
                    
                    <ImageUpload
                      initialImage={category.hero_image || ''}
                      onImageChange={({ file, url }) => {
                        if (file) {
                          // Handle file upload logic
                          const fileList = new DataTransfer();
                          fileList.items.add(file);
                          const mockEvent = {
                            target: { 
                              files: fileList.files,
                              value: '',
                              name: 'hero-image-upload'
                            },
                            preventDefault: () => {},
                            currentTarget: { files: fileList.files }
                          } as unknown as ChangeEvent<HTMLInputElement>;
                          handleImageChange(mockEvent);
                        } else if (url !== undefined) { // Handle empty string case too
                          // Set the image URL directly in your category state
                          // And make sure we're not setting the same URL again
                          console.log('DEBUG: onImageChange url received:', url);
                          console.log('DEBUG: Current category.hero_image:', category.hero_image);
                          
                          // Normalize URLs for comparison (trim whitespace, ensure null vs empty string consistency)
                          const normalizedNewUrl = url ? url.trim() : null;
                          const normalizedCurrentUrl = category.hero_image ? category.hero_image.trim() : null;
                          
                          console.log('DEBUG: Normalized new URL:', normalizedNewUrl);
                          console.log('DEBUG: Normalized current URL:', normalizedCurrentUrl);
                          
                          if (normalizedNewUrl !== normalizedCurrentUrl) {
                            console.log('DEBUG: Setting new URL in category state');
                            setCategory((prev) => ({ ...prev, hero_image: normalizedNewUrl }));
                            // Reset imageJustUploaded flag to ensure hasChanges works
                            setImageJustUploaded(false);
                          } else {
                            console.log('DEBUG: URL unchanged, not updating state');
                          }
                        }
                      }}
                      id="hero-image"
                      maxSizeMB={2}
                      label="Upload hero image"
                    />
                  </div>
                )}
                
                {/* Information about hero images for new categories */}
                {!isEditing && (
                  <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md">
                    <div className="flex items-start">
                      <AlertCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-sm">About Hero Images</h4>
                        <p className="text-sm mt-1">
                          You'll be able to add a hero image to this category after it's created. 
                          Please create the category first, then you can upload an image.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
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

              {/* Add a div to show the children categories with links to edit them */}
              {hasChildren && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-md">
                  <div className="flex items-start">
                    <AlertCircleIcon className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-sm">Cannot Delete - Has Sub-Categories</h4>
                      <p className="text-sm mt-1">
                        This category has the following sub-categories and cannot be deleted. 
                        You must first delete all sub-categories or reassign them to another parent.
                      </p>
                      <ul className="list-disc pl-5 mt-2">
                        {childrenCategories.map(child => (
                          <li key={child.id} className="mt-1">
                            <Link 
                              to={`/productCategoryEdit/${child.id}`} 
                              className="hover:text-green-600 dark:hover:text-green-400 hover:underline font-medium"
                            >
                              {child.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons - Moved to bottom of form */}
              <div className="flex flex-wrap justify-end gap-2 pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={handleAddSubCategory}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-700 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Sub-Category
                  </button>
                )}
                
                {/* If there's only an image file and no other changes, show Upload Image button */}
                {isEditing && imageFile && !hasChanges && !imageJustUploaded && (
                  <button
                    type="button"
                    onClick={uploadImage}
                    disabled={isUploading}
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-800 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <ImageIcon className="h-4 w-4 mr-2" />
                    {isUploading ? "Uploading..." : "Upload Image"}
                  </button>
                )}
                
                {/* Replace the custom button with PulseUpdateButton */}
                <div ref={updateButtonRef}>
                  <PulseUpdateButton
                    onClick={handleSubmit}
                    disabled={saving || loading || (isEditing && !hasChanges) || isUploading || (!isEditing && category.name.trim() === '')}
                    showPulse={shouldPulse}
                    label={isEditing ? "Update Category" : "Create Category"}
                    icon={<SaveIcon className="h-4 w-4" />}
                    changes={getChangesDescription}
                    onRevert={isEditing ? handleRevertChanges : undefined}
                    isLoading={saving}
                    tooltipTitle={isEditing ? "Unsaved Changes:" : "Create a category first:"}
                    revertButtonLabel={isEditing ? "Revert All Changes" : ""}
                  />
                </div>
                
                {isEditing && (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmOpen(true)}
                    disabled={hasChildren}
                    className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
                      hasChildren ? 'bg-red-900 cursor-not-allowed text-gray-500' : 'text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500'
                    }`}
                    title={hasChildren ? "Cannot delete a category that has sub-categories" : "Delete this category"}
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
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
            
            {/* Fixed Update button when original is scrolled out of view */}
            {shouldPulse && !isUpdateButtonVisible && (
              <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
                <PulseUpdateButton
                  onClick={handleSubmit}
                  disabled={saving || loading || isUploading}
                  showPulse={true}
                  label={isEditing ? "Update Category" : "Create Category"}
                  icon={<SaveIcon className="h-4 w-4" />}
                  changes={getChangesDescription}
                  onRevert={isEditing ? handleRevertChanges : undefined}
                  isLoading={saving}
                  tooltipTitle={isEditing ? "Unsaved Changes:" : "Create a category first:"}
                  revertButtonLabel={isEditing ? "Revert All Changes" : ""}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
} 