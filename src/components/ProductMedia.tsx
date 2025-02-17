import React from "react";

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
				<div className="space-y-4 mt-1">
					{mediaItems.map((item, index) => (
						<div
							key={item.media_id}
							className="border border-gray-300 dark:border-gray-600 rounded-md p-3"
						>
							{/* URL Field */}
							<div>
								<label
									htmlFor={`media-url-${index}`}
									className="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Media URL
								</label>
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
									className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
								/>
							</div>
							{/* Title Field */}
							<div className="mt-2">
								<label
									htmlFor={`media-title-${index}`}
									className="block text-sm font-medium text-gray-700 dark:text-gray-300"
								>
									Title (optional)
								</label>
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
									className="block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
								/>
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
									className="text-red-500 text-xs"
								>
									Delete Media
								</button>
							</div>
						</div>
					))}
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
						className="mt-2 inline-flex items-center px-2 py-1 border border-transparent rounded-md shadow-sm text-xs font-medium text-white bg-blue-600 hover:bg-blue-700"
					>
						Add Media
					</button>
				</div>
			</div>
		</fieldset>
	);
}
