// /src/components/Modal.tsx

import React from "react";

interface ModalProps {
	isOpen: boolean;
	onClose: () => void;
	title: string;
	children: React.ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
			<div className="bg-white dark:bg-gray-800 p-4 rounded shadow-lg max-w-lg w-full">
				<div className="flex justify-between items-center mb-4">
					<h3 className="text-lg font-bold text-gray-700 dark:text-gray-300">
						{title}
					</h3>
					<button
						onClick={onClose}
						className="text-gray-600 dark:text-gray-300 focus:outline-none text-2xl font-bold"
					>
						&times;
					</button>
				</div>
				{children}
			</div>
		</div>
	);
}
