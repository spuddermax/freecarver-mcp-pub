import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Folder as FolderIcon, Save as SaveIcon, Trash as TrashIcon } from "lucide-react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import { LoadingModal } from "../components/LoadingModal";
import { formatProductCategory } from "../utils/formatters";
import { ProductCategory } from "../types/Interfaces";

export default function ProductCategoryEdit() {
  const { targetId } = useParams<{ targetId: string }>();
  const navigate = useNavigate();
  const isEditing = !!targetId;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [category, setCategory] = useState<ProductCategory>({
    id: 0,
    name: "",
    description: "",
    parent_category_id: null,
    created_at: new Date(),
    updated_at: new Date()
  });

  useEffect(() => {
    if (isEditing) {
      loadCategory();
    } else {
      setLoading(false);
    }
  }, [targetId]);

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
      setCategory(formatProductCategory(data.data.category));
    } catch (error: any) {
      console.error("Error loading product category:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  }

  // Will be implemented in the future
  const handleSave = async () => {
    setSaving(true);
    try {
      // To be implemented
      setMessage({ type: "success", text: "Product category saved successfully" });
    } catch (error: any) {
      console.error("Error saving product category:", error);
      setMessage({ type: "error", text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout
      pageInfo={{
        title: isEditing ? "Edit Product Category" : "Create Product Category",
        icon: FolderIcon,
        iconColor: "text-blue-600 dark:text-blue-600",
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
      <LoadingModal isOpen={saving} message="Saving category..." />
      
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {isEditing ? `Edit Category: ${category.name}` : "Create New Category"}
              </h2>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  disabled={saving || loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  Save Category
                </button>
                
                {isEditing && (
                  <button
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-2" />
                    Delete
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                This is a placeholder for the category edit form that will be implemented later.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 