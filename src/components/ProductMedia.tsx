import React from "react";
import {
	Image as ImageIcon,
	Trash2,
	Plus,
	Code,
	Link2,
	Type,
} from "lucide-react";
import { Modal } from "../components/Modal";

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
						<div
							key={item.media_id}
							className="border border-gray-300 dark:border-gray-600 rounded-md p-3"
						>
							{/* Media Preview */}
							<div className="flex justify-center items-center bg-gray-100 dark:bg-gray-700 rounded mb-2 h-32 w-full">
								{item.url.trim() ? (
									<img
										src={item.url}
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
									htmlFor={`media-url-${index}`}
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
										id={`media-url-${index}`}
										value={item.url}
										onChange={(e) =>
											updateMediaItem(
												index,
												"url",
												e.target.value
											)
										}
										className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
									/>
								</div>
							</div>
							{/* Title Field */}
							<div className="mt-2">
								<label
									htmlFor={`media-title-${index}`}
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
										id={`media-title-${index}`}
										value={item.title || ""}
										onChange={(e) =>
											updateMediaItem(
												index,
												"title",
												e.target.value
											)
										}
										className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
									/>
								</div>
							</div>
							{/* Default Checkbox */}
							<div className="mt-2 flex items-center">
								<input
									type="checkbox"
									id={`media-default-${index}`}
									checked={item.default || false}
									onChange={(e) =>
										updateMediaItem(
											index,
											"default",
											e.target.checked
										)
									}
									className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
								/>
								<label
									htmlFor={`media-default-${index}`}
									className="ml-2 text-sm text-gray-700 dark:text-gray-300"
								>
									Default
								</label>
							</div>
							{/* Delete Button */}
							<div className="mt-2">
								<button
									type="button"
									onClick={() =>
										setMediaItems((prev) =>
											prev.filter(
												(_, idx) => idx !== index
											)
										)
									}
									className="inline-flex items-center px-3 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
								>
									<Trash2 className="h-4 w-4 mr-1" />
									Delete
								</button>
							</div>
						</div>
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
				{/* JSON Preview Modal using the Modal component */}
				<Modal
					isOpen={jsonPreviewOpen}
					onClose={() => setJsonPreviewOpen(false)}
					title="JSON Preview"
				>
					<pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-100 max-h-80 overflow-auto border border-gray-300 dark:border-gray-600 p-2 rounded">
						{JSON.stringify(mediaItems, null, 2)}
					</pre>
					<div className="mt-4 flex justify-end">
						<button
							type="button"
							onClick={() => setJsonPreviewOpen(false)}
							className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
						>
							Close
						</button>
					</div>
				</Modal>
			</div>
		</fieldset>
	);
}
