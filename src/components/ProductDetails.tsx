import { ChangeEvent } from "react";

interface ProductDetailsProps {
	name: string;
	description: string;
	onInputChange: (
		e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => void;
}

export function ProductDetails({
	name,
	description,
	onInputChange,
}: ProductDetailsProps) {
	return (
		<fieldset className="border rounded-lg p-4 border-gray-200 dark:border-gray-700">
			<legend className="text-lg font-medium text-gray-700 dark:text-gray-300 px-2">
				Product Details
			</legend>
			<div className="space-y-4">
				<div>
					<label
						htmlFor="name"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Product Name
					</label>
					<input
						type="text"
						name="name"
						id="name"
						value={name}
						onChange={onInputChange}
						className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>
				<div>
					<label
						htmlFor="description"
						className="block text-sm font-medium text-gray-700 dark:text-gray-300"
					>
						Description
					</label>
					<textarea
						name="description"
						id="description"
						rows={4}
						value={description}
						onChange={onInputChange}
						className="mt-1 block w-full pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
					/>
				</div>
			</div>
		</fieldset>
	);
}
