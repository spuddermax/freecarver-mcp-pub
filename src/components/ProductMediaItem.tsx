// /src/components/ProductMediaItem.tsx

import { useState, useEffect } from "react";
import { Image as ImageIcon, Trash2, Link2, Type, Loader } from "lucide-react";
import { ProductMediaItem as MediaItemType } from "./ProductMedia";
import { Modal } from "../components/Modal";
import { ImageUpload } from "../components/ImageUpload";
import { uploadProductMediaImage } from "../lib/api_client/products";
import { Toast } from "../components/Toast";

export interface ProductMediaItemProps {
	mediaItem: MediaItemType;
	// Function to update the media item field (e.g. "url", "title", "default")
	onUpdate: (key: keyof MediaItemType, value: any) => void;
	// Function to handle deletion of this media item
	onDelete: () => void;
	// Product ID for image uploads
	productId: number;
}

export function ProductMediaItem({
	mediaItem,
	onUpdate,
	onDelete,
	productId,
}: ProductMediaItemProps) {
	const [isImageModalOpen, setImageModalOpen] = useState(false);

	// Local state to temporarily hold the URL until the field is exited.
	const [tempUrl, setTempUrl] = useState(mediaItem.url);
	
	// State for file uploads
	const [isUploading, setIsUploading] = useState(false);
	const [uploadProgress, setUploadProgress] = useState(0);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	
	// Toast message state
	const [toast, setToast] = useState<{
		message: string;
		type: "success" | "error" | "info";
	} | null>(null);

	useEffect(() => {
		setTempUrl(mediaItem.url);
	}, [mediaItem.url]);

	// Handle image upload or URL changes
	const handleImageChange = async ({ file, url }: { file?: File; url: string }) => {
		console.log('handleImageChange called with:', { hasFile: !!file, url });
		
		if (file) {
			// Store the file for upload
			setSelectedFile(file);
			console.log('Processing file:', file.name, file.type, file.size);
			
			// Create a data URL for preview only
			const reader = new FileReader();
			reader.onloadend = () => {
				const dataUrl = reader.result as string;
				// Set the data URL as a temporary preview only
				setTempUrl(dataUrl);
				console.log('Data URL preview created (first 50 chars):', dataUrl.substring(0, 50) + '...');
			};
			reader.readAsDataURL(file);
			
			// Upload the file to Cloudflare
			try {
				setIsUploading(true);
				setUploadProgress(10); // Start progress
				console.log('Starting Cloudflare upload...');
				
				// Upload the image to Cloudflare
				const cloudflareUrl = await uploadProductMediaImage(
					file,
					productId,
					mediaItem.media_id,
					mediaItem.url || undefined
				);
				
				console.log('Cloudflare upload complete, URL:', cloudflareUrl);
				setUploadProgress(100); // Complete progress
				
				// Update both the local tempUrl and parent component with the actual Cloudflare URL
				setTempUrl(cloudflareUrl);
				onUpdate("url", cloudflareUrl);
				console.log('Updated parent component with Cloudflare URL');
				
				// Show success message
				setToast({
					type: "success",
					message: "Image uploaded successfully"
				});
				
				// Clear the selected file
				setSelectedFile(null);
			} catch (error: any) {
				console.error("Error uploading image:", error);
				
				// Show error message
				setToast({
					type: "error",
					message: `Error uploading image: ${error.message || "Unknown error"}`
				});
				
				// Important: Reset the URL to the original value if upload fails
				// This ensures we don't keep the data URL in the component state
				setTempUrl(mediaItem.url);
			} finally {
				setIsUploading(false);
				setUploadProgress(0);
			}
		} else if (url) {
			// If just a URL is provided (not a file upload), update it directly
			setTempUrl(url);
			onUpdate("url", url);
		}
	};

	return (
		<div className={`border border-gray-300 dark:border-gray-600 rounded-md p-3 ${isUploading ? 'media-item-uploading' : ''}`}>
			{/* Media Preview - Show only for non-empty URLs to avoid duplicate preview */}
			{tempUrl && !tempUrl.startsWith('data:') && (
				<div className="flex justify-center items-center bg-gray-100 dark:bg-gray-700 rounded mb-4 h-32 w-full">
					{tempUrl.includes("youtube.com/embed/") ? (
						<iframe
							src={tempUrl}
							className="max-h-full max-w-full object-contain rounded"
							title="YouTube video player"
							allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
							referrerPolicy="strict-origin-when-cross-origin"
							allowFullScreen
						/>
					) : (
						<img
							src={tempUrl}
							alt="Media Preview"
							className="max-h-full max-w-full object-contain rounded cursor-pointer"
							onClick={() => setImageModalOpen(true)}
						/>
					)}
				</div>
			)}

			{/* Modal for larger image preview */}
			{isImageModalOpen && (
				<Modal
					isOpen={isImageModalOpen}
					onClose={() => setImageModalOpen(false)}
					title={mediaItem.title || "Image Preview"}
				>
					<img
						src={tempUrl}
						alt={mediaItem.title || "Image Preview"}
						className="w-full object-contain rounded"
					/>
				</Modal>
			)}

			{/* Upload Progress Indicator */}
			{isUploading && (
				<div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded">
					<div className="flex items-center">
						<Loader className="animate-spin h-4 w-4 mr-2 text-blue-500" />
						<span className="text-sm font-medium text-blue-600 dark:text-blue-300">
							Uploading image to Cloudflare...
						</span>
					</div>
					<div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
						<div 
							className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out" 
							style={{ width: `${uploadProgress}%` }}
						></div>
					</div>
					<p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
						Please wait while your image is being uploaded. Do not click Save Media until the upload is complete.
					</p>
				</div>
			)}

			{/* Replace URL input with ImageUpload component */}
			<div className="mt-4">
				<label
					htmlFor={`media-${mediaItem.media_id}`}
					className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
				>
					Media
				</label>
				<ImageUpload
					initialImage={tempUrl}
					onImageChange={handleImageChange}
					id={`media-${mediaItem.media_id}`}
					maxSizeMB={2}
					acceptedTypes="image/*,video/*"
					label="Upload media image"
				/>
			</div>

			{/* Title Field */}
			<div className="mt-4">
				<label
					htmlFor={`media-title-${mediaItem.media_id}`}
					className="block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Title (optional)
				</label>
				<div className="mt-1 relative">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Type className="h-5 w-5 text-gray-400" />
					</div>
					<input
						type="text"
						id={`media-title-${mediaItem.media_id}`}
						value={mediaItem.title || ""}
						onChange={(e) => onUpdate("title", e.target.value)}
						className="block w-full pl-10 pr-3 py-2 border text-gray-700 border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>
			{/* Default Checkbox */}
			<div className="mt-4 flex items-center">
				<input
					type="checkbox"
					id={`media-default-${mediaItem.media_id}`}
					checked={mediaItem.default || false}
					onChange={(e) => onUpdate("default", e.target.checked)}
					className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
				/>
				<label
					htmlFor={`media-default-${mediaItem.media_id}`}
					className="ml-2 text-sm text-gray-700 dark:text-gray-300"
				>
					Default
				</label>
			</div>
			{/* Delete Button */}
			<div className="mt-4">
				<button
					type="button"
					onClick={onDelete}
					className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
				>
					<Trash2 className="h-4 w-4 mr-1" />
					Delete
				</button>
			</div>
			
			{/* Toast for messages */}
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}
		</div>
	);
}
