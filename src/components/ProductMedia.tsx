// /src/components/ProductMedia.tsx

import React from "react";
import { Trash2, Plus, Code, X } from "lucide-react";
import { Modal } from "../components/Modal";
import { ProductMediaItem } from "./ProductMediaItem";
import { ProductMediaJsonEditor } from "./ProductMediaJsonEditor";
export interface ProductMediaItem {
	media_id: string;
	url: string;
	title?: string;
	default?: boolean;
}

export interface ProductMediaProps {
	mediaItems: ProductMediaItem[];
	setMediaItems: React.Dispatch<React.SetStateAction<ProductMediaItem[]>>;
}

export function ProductMedia({ mediaItems, setMediaItems }: ProductMediaProps) {
	const [jsonPreviewOpen, setJsonPreviewOpen] = React.useState(false);
	// State for deletion confirmation: holds the index of media to delete or null if none.
	const [deleteIndex, setDeleteIndex] = React.useState<number | null>(null);
	const [jsonText, setJsonText] = React.useState(
		JSON.stringify(mediaItems, null, 2)
	);

	// Update a specific media item field
	const updateMediaItem = (
		index: number,
		key: keyof ProductMediaItem,
		value: any
	) => {
		setMediaItems((prev) => {
			const updated = [...prev];
			updated[index] = { ...updated[index], [key]: value };
			// If setting a media item as default, unset all others.
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

	React.useEffect(() => {
		if (jsonPreviewOpen) {
			// Update the JSON text when the modal is opened (or when mediaItems change)
			setJsonText(JSON.stringify(mediaItems, null, 2));
		}
	}, [jsonPreviewOpen, mediaItems]);

	return (
		<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
			<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
				Product Media
			</legend>
			<div>
				<label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
					Product Media (Manage images/videos)
				</label>
				{/* Grid layout for media items */}
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
				{/* "Add Media" and "JSON Edit" buttons */}
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
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
					>
						<Plus className="h-4 w-4 mr-1" />
						Add Media
					</button>
					<button
						type="button"
						onClick={() => setJsonPreviewOpen(true)}
						className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
					>
						<Code className="h-4 w-4 mr-1" />
						JSON Edit
					</button>
				</div>
				{/* Delete Confirmation Modal */}
				<Modal
					isOpen={deleteIndex !== null}
					onClose={() => setDeleteIndex(null)}
					title="Confirm Delete"
				>
					<div>
						<p>Are you sure you want to delete this media item?</p>
						<div className="mt-4 flex justify-end gap-4">
							<button
								type="button"
								onClick={() => setDeleteIndex(null)}
								className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
								className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
							>
								<Trash2 className="h-4 w-4 mr-1" />
								Delete
							</button>
						</div>
					</div>
				</Modal>
				{/* JSON Preview Modal using the Modal component */}
				<ProductMediaJsonEditor
					isOpen={jsonPreviewOpen}
					jsonText={jsonText}
					onJsonTextChange={setJsonText}
					onSave={() => setMediaItems(JSON.parse(jsonText))}
					onClose={() => setJsonPreviewOpen(false)}
				/>
			</div>
		</fieldset>
	);
}
