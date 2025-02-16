import React from "react";

interface PaginationProps {
	currentPage: number;
	onPageChange: (page: number) => void;
	canPaginateNext: boolean;
	/** Optional total number of pages to limit the page links. */
	totalPages?: number;
}

export function Pagination({
	currentPage,
	onPageChange,
	canPaginateNext,
	totalPages,
}: PaginationProps) {
	const maxVisible = 5;

	// If totalPages is provided, calculate a range of up to maxVisible pages.
	const getPageNumbers = (
		currentPage: number,
		totalPages?: number
	): number[] => {
		let pages: number[] = [];
		if (totalPages) {
			// Calculate start page so that currentPage is centered when possible.
			let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
			let end = start + maxVisible - 1;
			if (end > totalPages) {
				end = totalPages;
				start = Math.max(1, end - maxVisible + 1);
			}
			for (let i = start; i <= end; i++) {
				pages.push(i);
			}
			return pages;
		}

		// Fallback if totalPages is not provided:
		if (currentPage < 3) {
			const maxPage = canPaginateNext ? 5 : currentPage;
			for (let i = 1; i <= maxPage; i++) {
				pages.push(i);
			}
		} else {
			if (canPaginateNext) {
				const start = currentPage - 2;
				const end = currentPage + 2;
				for (let i = start; i <= end; i++) {
					pages.push(i);
				}
			} else {
				const start = Math.max(1, currentPage - 4);
				for (let i = start; i <= currentPage; i++) {
					pages.push(i);
				}
			}
		}
		return pages;
	};

	const pages = getPageNumbers(currentPage, totalPages);

	return (
		<div className="flex items-center justify-center py-4">
			<button
				disabled={currentPage === 1}
				onClick={() => onPageChange(currentPage - 1)}
				className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded disabled:opacity-50"
			>
				Previous
			</button>
			<div className="flex space-x-2 mx-4">
				{pages.map((page) => (
					<button
						key={page}
						onClick={() => onPageChange(page)}
						className={`px-3 py-1 rounded ${
							page === currentPage
								? "bg-blue-600 text-white"
								: "bg-gray-200 dark:bg-gray-700 text-black"
						}`}
					>
						{page}
					</button>
				))}
			</div>
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
