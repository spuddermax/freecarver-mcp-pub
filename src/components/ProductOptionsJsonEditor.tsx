import React from "react";
import { Modal } from "./Modal";
import { Save, X } from "lucide-react";
import { Option } from "./ProductOptions";

export interface ProductOptionsJsonEditorProps {
	isOpen: boolean;
	jsonText: string;
	onJsonTextChange: (text: string) => void;
	onSave: (parsedJSON: Option[]) => void;
	onClose: () => void;
}

export function ProductOptionsJsonEditor({
	isOpen,
	jsonText,
	onJsonTextChange,
	onSave,
	onClose,
}: ProductOptionsJsonEditorProps) {
	const handleApply = () => {
		try {
			const parsedJSON = JSON.parse(jsonText);
			onSave(parsedJSON);
		} catch (error) {
			alert("Invalid JSON. Please check your syntax and try again.");
		}
	};

	return (
		<Modal isOpen={isOpen} onClose={onClose} title="Options JSON Editor">
			<div className="mb-2 text-sm text-gray-600 dark:text-gray-400">
				Edit the raw JSON for product options and variants. Ensure the
				structure matches the API format.
			</div>
			<textarea
				value={jsonText}
				onChange={(e) => onJsonTextChange(e.target.value)}
				className="whitespace-pre-wrap font-mono text-sm text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-900 w-full h-80 overflow-auto border border-gray-300 dark:border-gray-600 p-2 rounded"
			/>
			<div className="mt-4 flex justify-end gap-4">
				<button
					type="button"
					onClick={handleApply}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
				>
					<Save className="h-4 w-4 mr-1" />
					Apply Changes
				</button>
				<button
					type="button"
					onClick={onClose}
					className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
				>
					<X className="h-4 w-4 mr-1" />
					Close
				</button>
			</div>
		</Modal>
	);
}
