// /src/pages/products.tsx

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Package as PackageIcon,
	Search as SearchIcon,
	Plus as PlusIcon,
	Loader2 as Loader2Icon,
} from "lucide-react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import { Pagination } from "../components/Pagination";
import { formatProduct } from "../utils/formatters";

interface ProductData {
	id: string;
	name: string;
	price: number;
	productMedia: {
		url: string;
	}[];
	createdAt: string;
}

export default function Products() {
	const navigate = useNavigate();
	const [products, setProducts] = useState<ProductData[]>([]);
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
	const limit = 20; // Always fetch 20 products per page

	useEffect(() => {
		loadProducts();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPage]);

	useEffect(() => {
		const timer = setTimeout(() => {
			setIsSearching(true);
			setIsSearching(false);
		}, 300);
		return () => clearTimeout(timer);
	}, [searchQuery]);

	async function loadProducts() {
		setLoading(true);
		try {
			const token = localStorage.getItem("jwtToken");
			// Build query string with pagination and default ordering params.
			const queryString = `?page=${currentPage}&limit=${limit}&orderBy=name&order=asc`;
			const response = await fetch(
				import.meta.env.VITE_API_URL + "/v1/products" + queryString,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				}
			);
			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to fetch products");
			}
			const data = await response.json();
			// Assume API returns a total count for products as "data.data.total"
			const total = data.data.total || 0;
			const computedTotalPages = total > 0 ? Math.ceil(total / limit) : 1;
			setTotalPages(computedTotalPages);
			// Map the products using the formatter.
			const formattedProducts = data.data.products.map((product: any) =>
				formatProduct(product)
			);
			setProducts(formattedProducts);
		} catch (error: any) {
			console.error("Error loading products:", error);
			setMessage({ type: "error", text: error.message });
		} finally {
			setLoading(false);
		}
	}

	const filterProducts = () => {
		const searchLower = searchQuery.toLowerCase();
		if (!searchLower) return products;
		return products.filter((product) =>
			product.name.toLowerCase().includes(searchLower)
		);
	};

	const filteredProducts = filterProducts();

	return (
		<Layout
			pageInfo={{
				title: "Manage Products",
				icon: PackageIcon,
				iconColor: "text-red-600 dark:text-red-600",
			}}
			breadcrumbs={[
				{ label: "Dashboard", link: "/dashboard" },
				{ label: "Manage Products" },
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
											placeholder="Search products..."
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
											navigate("/productCreate")
										}
									>
										<PlusIcon className="h-4 w-4 mr-2" />
										Add Product
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
											Product
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Price
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Created
										</th>
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
									{loading ? (
										<tr>
											<td
												colSpan={3}
												className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
											>
												Loading products...
											</td>
										</tr>
									) : filteredProducts.length === 0 ? (
										<tr>
											<td
												colSpan={3}
												className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
											>
												No products found
											</td>
										</tr>
									) : (
										filteredProducts.map((product) => (
											<tr
												key={product.id}
												className="hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
												onClick={() =>
													navigate(
														`/productEdit/${product.id}`
													)
												}
											>
												<td className="px-6 py-4 whitespace-nowrap">
													<div className="flex items-center">
														{product.productMedia &&
														product.productMedia
															.length > 0 ? (
															<img
																src={
																	product
																		.productMedia[0]
																		.url
																}
																alt={
																	product.name
																}
																className="h-8 w-8 rounded"
															/>
														) : (
															<div className="h-8 w-8 rounded bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
																<PackageIcon className="h-4 w-4 text-gray-500 dark:text-gray-400" />
															</div>
														)}
														<div className="ml-4">
															<div className="text-sm font-medium text-gray-900 dark:text-white">
																{product.name}
															</div>
														</div>
													</div>
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
													${product.price}
												</td>
												<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
													{product.createdAt}
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
