// /src/components/ProductMedia.tsx

import React, { useState, useRef, useEffect, useMemo } from "react";
import { Trash2, Plus, Code, Save, X } from "lucide-react";
import { Modal } from "../components/Modal";
import { ProductMediaItem } from "./ProductMediaItem";
import { ProductMediaJsonEditor } from "./ProductMediaJsonEditor";
import { updateProduct } from "../lib/api_client/products";
import { Toast } from "../components/Toast";
import { ThumbnailBar } from "./ProductMediaThumbnailBar";
import { Product } from "../types/Interfaces";
import { LoadingModal } from "./LoadingModal";
import PulseUpdateButton, { pulseAnimationCSS } from "../components/PulseUpdateButton";

export interface ProductMediaItem {
	media_id: string;
	url: string;
	title?: string;
	default?: boolean;
}

export interface ProductMediaProps {
	product: Product;
	mediaItems: ProductMediaItem[];
	setMediaItems: React.Dispatch<React.SetStateAction<ProductMediaItem[]>>;
}

export function ProductMedia({
	product,
	mediaItems,
	setMediaItems,
}: ProductMediaProps) {
	// Extract the product ID
	const productId = product.id.toString();

	const [jsonPreviewOpen, setJsonPreviewOpen] = React.useState(false);
	const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null);
	const [jsonText, setJsonText] = React.useState(
		JSON.stringify(mediaItems, null, 2)
	);

	// Use state to keep track of the original (saved) media items as a JSON string.
	const [originalMediaJSON, setOriginalMediaJSON] = React.useState(
		JSON.stringify(mediaItems)
	);

	// Loading state for API operations
	const [isLoading, setIsLoading] = useState(false);

	// State for toast messages.
	const [toast, setToast] = React.useState<{
		message: string;
		type: "success" | "error" | "info";
	} | null>(null);

	// Ref and state to track visibility of Save Media button
	const saveButtonRef = useRef<HTMLDivElement>(null);
	const [isSaveButtonVisible, setIsSaveButtonVisible] = useState(true);

	React.useEffect(() => {
		if (jsonPreviewOpen) {
			setJsonText(JSON.stringify(mediaItems, null, 2));
		}
	}, [jsonPreviewOpen, mediaItems]);

	useEffect(() => {
		if (!saveButtonRef.current) return;
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					setIsSaveButtonVisible(entry.isIntersecting);
				});
			},
			{ root: null, threshold: 0.1 }
		);
		observer.observe(saveButtonRef.current);
		return () => {
			if (saveButtonRef.current) {
				observer.unobserve(saveButtonRef.current);
			}
		};
	}, []);

	// Update a specific media item field.
	const updateMediaItem = (
		index: number,
		key: keyof ProductMediaItem,
		value: any
	) => {
		setMediaItems((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], [key]: value };
			if (key === "default" && value === true) {
				return updated.map((item, idx) =>
					idx === index
						? { ...item, default: true }
						: { ...item, default: false }
				);
			}
			return updated;
		});
	};

	// Save just the product_media field using the API client.
	const handleSaveMedia = async () => {
		console.log('Saving media items:', JSON.stringify(mediaItems, null, 2));
		
		// Check if any ProductMediaItems are still uploading
		const uploadingItems = document.querySelectorAll('.media-item-uploading');
		if (uploadingItems.length > 0) {
			setToast({
				message: `Please wait for all uploads to complete before saving (${uploadingItems.length} in progress).`,
				type: "info",
			});
			return;
		}
		
		// Filter out any data URLs - they should never be saved to the database
		const filteredMediaItems = mediaItems.map(item => {
			if (item.url && typeof item.url === 'string' && item.url.startsWith('data:')) {
				console.warn(`Found data URL in item ${item.media_id}. This will be removed to prevent saving binary data to the database.`);
				return { ...item, url: '' }; // Replace data URL with empty string
			}
			return item;
		});
		
		// Check for any data URLs that were filtered out
		const removedItems = mediaItems.filter(item => 
			item.url && typeof item.url === 'string' && item.url.startsWith('data:')
		);
		
		if (removedItems.length > 0) {
			console.warn(`WARNING: Found ${removedItems.length} data URLs in media items:`);
			removedItems.forEach(item => {
				console.warn(`- Item ${item.media_id} (${item.title || 'Untitled'}): URL starts with "data:"`);
			});
			
			// Show warning toast
			setToast({
				message: `Warning: ${removedItems.length} media item(s) with temporary data were not uploaded properly. Please try uploading those images again.`,
				type: "error",
			});
			
			// Update the UI with filtered items
			setMediaItems(filteredMediaItems);
			return; // Don't save to the database yet
		}
		
		setIsLoading(true);
		try {
			await updateProduct({ id: productId, product_media: filteredMediaItems });
			console.log('Media items saved successfully');
			
			// Update the original media JSON after saving.
			setOriginalMediaJSON(JSON.stringify(filteredMediaItems));
			// Use the Toast component to display success.
			setToast({
				message: "Product media saved successfully.",
				type: "success",
			});
		} catch (error: any) {
			console.error("Error saving product media:", error);
			setToast({
				message: "Error saving product media: " + error.message,
				type: "error",
			});
		} finally {
			setIsLoading(false);
		}
	};

	// Check if media has changed by comparing the JSON strings.
	const isMediaUnchanged = JSON.stringify(mediaItems) === originalMediaJSON;

	// Generate a description of changes for the tooltip
	const mediaChanges = useMemo(() => {
		if (isMediaUnchanged) return [];

		const originalItems = JSON.parse(originalMediaJSON || "[]");
		const changes: string[] = [];

		// Check for added items
		const addedItems = mediaItems.filter(
			item => !originalItems.some((original: ProductMediaItem) => original.media_id === item.media_id)
		);
		if (addedItems.length > 0) {
			changes.push(`Added ${addedItems.length} new media item${addedItems.length > 1 ? 's' : ''}`);
		}

		// Check for removed items
		const removedItems = originalItems.filter(
			(original: ProductMediaItem) => !mediaItems.some(item => item.media_id === original.media_id)
		);
		if (removedItems.length > 0) {
			changes.push(`Removed ${removedItems.length} media item${removedItems.length > 1 ? 's' : ''}`);
		}

		// Check for updated items
		const existingItemIds = mediaItems
			.filter(item => 
				originalItems.some((original: ProductMediaItem) => original.media_id === item.media_id)
			)
			.map(item => item.media_id);

		existingItemIds.forEach((id: string) => {
			const originalItem = originalItems.find((item: ProductMediaItem) => item.media_id === id);
			const currentItem = mediaItems.find(item => item.media_id === id);
			
			if (originalItem && currentItem) {
				if (originalItem.url !== currentItem.url) {
					changes.push(`Changed URL for "${currentItem.title || 'Untitled media'}" item`);
				}
				if (originalItem.title !== currentItem.title) {
					changes.push(`Changed title from "${originalItem.title || 'Untitled'}" to "${currentItem.title || 'Untitled'}"`);
				}
				if (originalItem.default !== currentItem.default) {
					if (currentItem.default) {
						changes.push(`Set "${currentItem.title || 'Untitled media'}" as default`);
					}
				}
			}
		});

		// Check if order changed
		const originalIds = originalItems.map((item: ProductMediaItem) => item.media_id);
		const currentIds = mediaItems.map(item => item.media_id);
		
		if (
			originalIds.length === currentIds.length &&
			originalIds.every((id: string) => currentIds.includes(id)) &&
			!originalIds.every((id: string, index: number) => id === currentIds[index])
		) {
			changes.push("Changed media display order");
		}

		return changes;
	}, [mediaItems, originalMediaJSON, isMediaUnchanged]);

	return (
		<fieldset className="border rounded-lg p-4 border-cyan-200 dark:border-cyan-700 relative">
			{/* Add the CSS animation to the head */}
			<style>{pulseAnimationCSS}</style>
			
			<legend className="text-2xl font-medium text-gray-700 dark:text-gray-300 px-2">
				Product Media
			</legend>
			{mediaItems.length > 0 && (
				<div id="media-order" className="mb-4">
					<label className="block text-lg font-medium text-gray-700 dark:text-gray-300">
						Media Order (Drag and drop to reorder)
					</label>
					<div className="mb-4">
						<ThumbnailBar
							mediaItems={mediaItems}
							setMediaItems={setMediaItems}
						/>
					</div>
					<label className="block text-lg font-medium text-gray-700 dark:text-gray-300">
						Media Items
					</label>
					{/* Media items grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-1">
						{mediaItems.map((item, index) => (
							<ProductMediaItem
								key={item.media_id}
								mediaItem={item}
								onUpdate={(key, value) =>
									updateMediaItem(index, key, value)
								}
								onDelete={() => setDeleteIndex(index)}
								productId={parseInt(productId, 10)}
							/>
						))}
					</div>
				</div>
			)}
			<div>
				{/* Buttons */}
				<div className="flex justify-start space-x-2">
					<button
						type="button"
						onClick={() => {
							const newItem: ProductMediaItem = {
								media_id: Date.now().toString(),
								url: "",
								title: "",
								default: false,
							};
							setMediaItems((prev) => [...prev, newItem]);
						}}
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600"
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Media
					</button>
					<button
						type="button"
						onClick={() => setJsonPreviewOpen(true)}
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white  bg-purple-700 hover:bg-purple-600"
					>
						<Code className="h-4 w-4 mr-1" />
						Edit Media JSON
					</button>
					
					{/* Replace this button with PulseUpdateButton */}
					<div ref={saveButtonRef}>
						<PulseUpdateButton
							onClick={handleSaveMedia}
							disabled={isMediaUnchanged || isLoading}
							showPulse={!isMediaUnchanged && !isLoading}
							label="Save Media"
							icon={<Save className="h-4 w-4" />}
							changes={mediaChanges}
							isLoading={isLoading}
							tooltipTitle="Unsaved Media Changes:"
						/>
					</div>
				</div>
				{/* Delete Confirmation Modal */}
				<Modal
					isOpen={deleteIndex !== null}
					onClose={() => setDeleteIndex(null)}
					title="Confirm Delete"
				>
					<div>
						<p>
							Are you sure you want to delete this media item? You
							must still save the media to actually remove it from
							the database.
						</p>
						<div className="mt-4 flex justify-end gap-4">
							<button
								type="button"
								onClick={() => setDeleteIndex(null)}
								className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
							>
								<X className="h-4 w-4 mr-1" />
								Cancel
							</button>
							<button
								type="button"
								onClick={() => {
									if (deleteIndex !== null) {
										setMediaItems((prev) =>
											prev.filter(
												(_, idx) => idx !== deleteIndex
											)
										);
										setDeleteIndex(null);
									}
								}}
								className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-700 hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500"
							>
								<Trash2 className="h-4 w-4 mr-1" />
								Delete
							</button>
						</div>
					</div>
				</Modal>
				{/* JSON Editor Modal */}
				<ProductMediaJsonEditor
					isOpen={jsonPreviewOpen}
					jsonText={jsonText}
					onJsonTextChange={setJsonText}
					onSave={(parsedJSON) => {
						setMediaItems(parsedJSON);
						setJsonPreviewOpen(false);
					}}
					onClose={() => setJsonPreviewOpen(false)}
				/>
			</div>
			{/* Fixed Save Media button if the original is scrolled out of view */}
			{!isMediaUnchanged && !isSaveButtonVisible && (
				<div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
					<PulseUpdateButton
						onClick={handleSaveMedia}
						disabled={isLoading}
						showPulse={true}
						label="Save Media"
						icon={<Save className="h-4 w-4" />}
						changes={mediaChanges}
						isLoading={isLoading}
						tooltipTitle="Unsaved Media Changes:"
					/>
				</div>
			)}
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}
			{/* Loading Modal */}
			<LoadingModal
				isOpen={isLoading}
				message="Updating product media..."
			/>
		</fieldset>
	);
}
