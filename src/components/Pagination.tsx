import React from "react";

interface PaginationProps {
	currentPage: number;
	onPageChange: (page: number) => void;
	canPaginateNext: boolean;
}

export function Pagination({
	currentPage,
	onPageChange,
	canPaginateNext,
}: PaginationProps) {
	return (
		<div className="flex justify-between items-center py-4">
			<button
				disabled={currentPage === 1}
				onClick={() => onPageChange(currentPage - 1)}
				className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
			>
				Previous
			</button>
			<span>Page {currentPage}</span>
			<button
				disabled={!canPaginateNext}
				onClick={() => onPageChange(currentPage + 1)}
				className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
			>
				Next
			</button>
		</div>
	);
}
