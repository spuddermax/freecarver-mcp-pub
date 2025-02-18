// /src/components/ProductMedia.tsx

import React, { useState, useRef, useEffect } from "react";
import { Trash2, Plus, Code, Save, X } from "lucide-react";
import { Modal } from "../components/Modal";
import { ProductMediaItem } from "./ProductMediaItem";
import { ProductMediaJsonEditor } from "./ProductMediaJsonEditor";
import { updateProduct } from "../lib/api_client/products";
import Toast from "../components/Toast";
import { ThumbnailBar } from "./ProductMediaThumbnailBar";

export interface ProductMediaItem {
	media_id: string;
	url: string;
	title?: string;
	default?: boolean;
}

export interface ProductMediaProps {
	mediaItems: ProductMediaItem[];
	setMediaItems: React.Dispatch<React.SetStateAction<ProductMediaItem[]>>;
	productId: string;
}

export function ProductMedia({
	mediaItems,
	setMediaItems,
	productId,
}: ProductMediaProps) {
	const [jsonPreviewOpen, setJsonPreviewOpen] = React.useState(false);
	const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null);
	const [jsonText, setJsonText] = React.useState(
		JSON.stringify(mediaItems, null, 2)
	);

	// Use state to keep track of the original (saved) media items as a JSON string.
	const [originalMediaJSON, setOriginalMediaJSON] = React.useState(
		JSON.stringify(mediaItems)
	);

	// State for toast messages.
	const [toast, setToast] = React.useState<{
		message: string;
		type: "success" | "error" | "info";
	} | null>(null);

	// Ref and state to track visibility of Save Media button
	const saveButtonRef = useRef<HTMLButtonElement>(null);
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
		try {
			await updateProduct({ id: productId, product_media: mediaItems });
			// Update the original media JSON after saving.
			setOriginalMediaJSON(JSON.stringify(mediaItems));
			// Use the Toast component to display success.
			setToast({
				message: "Product media saved successfully.",
				type: "success",
			});
		} catch (error: any) {
			console.error("Error saving product media:", error);
			alert("Error saving product media: " + error.message);
		}
	};

	// Check if media has changed by comparing the JSON strings.
	const isMediaUnchanged = JSON.stringify(mediaItems) === originalMediaJSON;

	return (
		<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700 relative">
			<div className="mb-4">
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
					Media Order (Drag and drop to reorder)
				</label>
				<ThumbnailBar
					mediaItems={mediaItems}
					setMediaItems={setMediaItems}
				/>
			</div>

			<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
				Product Media
			</legend>
			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
						/>
					))}
				</div>
				{/* Buttons */}
				<div className="mt-4 flex justify-center gap-4">
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
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-700 hover:bg-purple-600"
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Media
					</button>
					<button
						type="button"
						onClick={() => setJsonPreviewOpen(true)}
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-700 hover:bg-green-600"
					>
						<Code className="h-4 w-4 mr-1" />
						JSON Edit
					</button>
					<button
						type="button"
						ref={saveButtonRef}
						onClick={handleSaveMedia}
						disabled={isMediaUnchanged}
						className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500 ${
							isMediaUnchanged
								? "text-gray-500 bg-blue-900 cursor-not-allowed"
								: "text-white bg-blue-600 hover:bg-blue-700"
						}`}
					>
						<Save className="h-4 w-4 mr-1" />
						Save Media
					</button>
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
							must still save the media to actually remove it.
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
					<button
						type="button"
						onClick={handleSaveMedia}
						className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-purple-500 ${
							isMediaUnchanged
								? "bg-purple-300 cursor-not-allowed"
								: "bg-blue-700 hover:bg-blue-600"
						}`}
					>
						<Save className="h-4 w-4 mr-1" />
						Save Media
					</button>
				</div>
			)}
			{toast && (
				<Toast
					message={toast.message}
					type={toast.type}
					onClose={() => setToast(null)}
				/>
			)}
		</fieldset>
	);
}
