// /src/components/ProductMediaItem.tsx

import "react";
import { Image as ImageIcon, Trash2, Link2, Type } from "lucide-react";
import { ProductMediaItem as MediaItemType } from "./ProductMedia";

export interface ProductMediaItemProps {
	mediaItem: MediaItemType;
	// Function to update the media item field (e.g. "url", "title", "default")
	onUpdate: (key: keyof MediaItemType, value: any) => void;
	// Function to handle deletion of this media item
	onDelete: () => void;
}

export function ProductMediaItem({
	mediaItem,
	onUpdate,
	onDelete,
}: ProductMediaItemProps) {
	return (
		<div className="border border-gray-300 dark:border-gray-600 rounded-md p-3">
			{/* Media Preview */}
			<div className="flex justify-center items-center bg-gray-100 dark:bg-gray-700 rounded mb-2 h-32 w-full">
				{mediaItem.url.trim() ? (
					<img
						src={mediaItem.url}
						alt="Media Preview"
						className="max-h-full max-w-full object-contain rounded"
					/>
				) : (
					<ImageIcon className="h-8 w-8 text-gray-400" />
				)}
			</div>
			{/* Media URL Field */}
			<div>
				<label
					htmlFor="media-url"
					className="block text-sm font-medium text-gray-700 dark:text-gray-300"
				>
					Media URL
				</label>
				<div className="mt-1 relative">
					<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
						<Link2 className="h-5 w-5 text-gray-400" />
					</div>
					<input
						type="text"
						id="media-url"
						value={mediaItem.url}
						onChange={(e) => onUpdate("url", e.target.value)}
						className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>
			{/* Title Field */}
			<div className="mt-2">
				<label
					htmlFor="media-title"
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
						id="media-title"
						value={mediaItem.title || ""}
						onChange={(e) => onUpdate("title", e.target.value)}
						className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>
			{/* Default Checkbox */}
			<div className="mt-2 flex items-center">
				<input
					type="checkbox"
					id="media-default"
					checked={mediaItem.default || false}
					onChange={(e) => onUpdate("default", e.target.checked)}
					className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
				/>
				<label
					htmlFor="media-default"
					className="ml-2 text-sm text-gray-700 dark:text-gray-300"
				>
					Default
				</label>
			</div>
			{/* Delete Button */}
			<div className="mt-2">
				<button
					type="button"
					onClick={onDelete}
					className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
				>
					<Trash2 className="h-4 w-4 mr-1" />
					Delete
				</button>
			</div>
		</div>
	);
}
