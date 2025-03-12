import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Folder as FolderIcon,
	Search as SearchIcon,
	Plus as PlusIcon,
	Loader2 as Loader2Icon,
} from "lucide-react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import { Pagination } from "../components/Pagination";
import { formatProductCategory } from "../utils/formatters";
import { ProductCategory } from "../types/Interfaces";
import { format } from "date-fns";
import { LoadingModal } from "../components/LoadingModal";

export default function ProductCategories() {
	const navigate = useNavigate();
	const [categories, setCategories] = useState<ProductCategory[]>([]);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");
	const [isSearching, setIsSearching] = useState(false);
	const [message, setMessage] = useState<{
		type: "success" | "error";
		text: string;
	} | null>(null);
	// Pagination state
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const limit = 20; // Always fetch 20 categories per page

	useEffect(() => {
		loadCategories();
	}, [currentPage]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsSearching(true);
			setIsSearching(false);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	async function loadCategories() {
		setLoading(true);
		try {
			const token = localStorage.getItem("jwtToken");
			// Build query string with pagination and default ordering params.
			const queryString = `?page=${currentPage}&limit=${limit}&orderBy=name&order=asc`;
			const response = await fetch(
				import.meta.env.VITE_API_URL + "/v1/product_categories" + queryString,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to fetch product categories");
			}
			const data = await response.json();
			// Assume API returns a total count for categories as "data.data.total"
			const total = data.data.total || 0;
			const computedTotalPages = total > 0 ? Math.ceil(total / limit) : 1;
			setTotalPages(computedTotalPages);
			// Map the categories using the formatter.
			const formattedCategories = data.data.categories.map((category: any) =>
				formatProductCategory(category)
			);
			setCategories(formattedCategories);
		} catch (error: any) {
			console.error("Error loading product categories:", error);
			setMessage({ type: "error", text: error.message });
		} finally {
			setLoading(false);
		}
	}

	const filterCategories = () => {
		const searchLower = searchQuery.toLowerCase();
		if (!searchLower) return categories;
		return categories.filter((category) =>
			category.name.toLowerCase().includes(searchLower)
		);
	};

	const filteredCategories = filterCategories();

	return (
		<Layout
			pageInfo={{
				title: "Manage Product Categories",
				icon: FolderIcon,
				iconColor: "text-blue-600 dark:text-blue-600",
			}}
			breadcrumbs={[
				{ label: "Dashboard", link: "/dashboard" },
				{ label: "Manage Product Categories" },
			]}
		>
			{message && (
				<Toast
					message={message.text}
					type={message.type}
					onClose={() => setMessage(null)}
				/>
			)}
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				<div className="px-4 py-6 sm:px-0">
					<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
						<div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
								<div className="mt-4 sm:mt-0 flex items-center space-x-4">
									<div className="relative">
										<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
											{isSearching ? (
												<Loader2Icon className="h-5 w-5 text-gray-400 animate-spin" />
											) : (
												<SearchIcon className="h-5 w-5 text-gray-400" />
											)}
										</div>
										<input
											type="text"
											placeholder="Search categories..."
											value={searchQuery}
											onChange={(e) =>
												setSearchQuery(e.target.value)
											}
											className={`block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors ${
												isSearching
													? "border-blue-300 dark:border-blue-700"
													: ""
											}`}
										/>
										{searchQuery && (
											<div className="absolute inset-y-0 right-0 pr-3 flex items-center">
												<button
													onClick={() =>
														setSearchQuery("")
													}
													className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
												>
													<span className="sr-only">
														Clear search
													</span>
													<svg
														className="h-5 w-5"
														viewBox="0 0 20 20"
														fill="currentColor"
													>
														<path
															fillRule="evenodd"
															d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
															clipRule="evenodd"
														/>
													</svg>
												</button>
											</div>
										)}
									</div>
									<button
										className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
										onClick={() =>
											navigate("/productCategoryCreate")
										}
									>
										<PlusIcon className="h-4 w-4 mr-2" />
										Add Category
									</button>
								</div>
							</div>
						</div>

						<Pagination
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							canPaginateNext={currentPage < totalPages}
							totalPages={totalPages}
						/>

						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
								<thead className="bg-gray-50 dark:bg-gray-900">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Category
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Parent Category
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Created
										</th>
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
									{loading ? (
										<LoadingModal
											isOpen={loading}
											message="Loading categories..."
										/>
									) : filteredCategories.length === 0 ? (
										<tr>
											<td
												colSpan={3}
												className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
											>
												No categories found
											</td>
										</tr>
									) : (
										filteredCategories.map((category) => (
											<tr
												key={category.id}
												className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
												onClick={() =>
													navigate(
														`/productCategoryEdit/${category.id}`
													)
												}
											>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center">
														<div className="h-8 w-8 rounded bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
															<FolderIcon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
														</div>
														<div className="ml-4">
															<div className="text-sm font-medium text-gray-900 dark:text-white">
																{category.name}
															</div>
															{category.description && (
																<div className="text-xs text-gray-500 dark:text-gray-400">
																	{category.description.length > 50
																		? `${category.description.substring(0, 50)}...`
																		: category.description}
																</div>
															)}
														</div>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
													{category.parent_category_id 
														? categories.find(c => c.id === category.parent_category_id)?.name || "Unknown"
														: "None"}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
													{format(
														new Date(category.created_at),
														"MM/dd/yyyy"
													)}
												</td>
											</tr>
										))
									)}
								</tbody>
							</table>
						</div>

						<Pagination
							currentPage={currentPage}
							onPageChange={setCurrentPage}
							canPaginateNext={currentPage < totalPages}
							totalPages={totalPages}
						/>
					</div>
				</div>
			</div>
		</Layout>
	);
} 