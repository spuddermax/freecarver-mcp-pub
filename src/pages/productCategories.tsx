import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Folder as FolderIcon,
	Search as SearchIcon,
	Plus as PlusIcon,
	Loader2 as Loader2Icon,
	ChevronRight,
	ChevronDown,
	Edit as EditIcon,
} from "lucide-react";
import Layout from "../components/Layout";
import { Toast } from "../components/Toast";
import { Pagination } from "../components/Pagination";
import { formatProductCategory } from "../utils/formatters";
import { ProductCategory } from "../types/Interfaces";
import { format } from "date-fns";
import { LoadingModal } from "../components/LoadingModal";

// Structure to keep track of expanded state
interface CategoryTreeNode extends ProductCategory {
	children: CategoryTreeNode[];
	isExpanded?: boolean;
}

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
	// Track which node is being toggled
	const [togglingNodeId, setTogglingNodeId] = useState<number | null>(null);
	// Tree structure for categories
	const [categoryTree, setCategoryTree] = useState<CategoryTreeNode[]>([]);
	// Pagination state
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [totalPages, setTotalPages] = useState<number>(1);
	const limit = 100; // Increased to accommodate tree view

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

	// Effect to build the tree structure whenever categories change
	useEffect(() => {
		buildCategoryTree();
	}, [categories]);

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

	// Function to build the tree structure from flat categories array
	const buildCategoryTree = () => {
		if (!categories.length) return;

		// First, create all nodes with empty children array
		const nodes: { [key: number]: CategoryTreeNode } = {};
		categories.forEach(category => {
			nodes[category.id] = { ...category, children: [], isExpanded: false };
		});

		// Then, build the tree by adding children to their parents
		const rootNodes: CategoryTreeNode[] = [];
		Object.values(nodes).forEach(node => {
			if (node.parent_category_id === null) {
				rootNodes.push(node);
			} else if (nodes[node.parent_category_id]) {
				nodes[node.parent_category_id].children.push(node);
			} else {
				// If parent doesn't exist, treat as root
				rootNodes.push(node);
			}
		});

		// Sort the root nodes
		rootNodes.sort((a, b) => a.name.localeCompare(b.name));
		
		// Sort children of each node
		const sortChildren = (node: CategoryTreeNode) => {
			node.children.sort((a, b) => a.name.localeCompare(b.name));
			node.children.forEach(sortChildren);
		};
		
		rootNodes.forEach(sortChildren);
		
		setCategoryTree(rootNodes);
	};

	// Toggle the expanded state of a category
	const toggleExpand = (nodeId: number, e: React.MouseEvent) => {
		// Stop event propagation to prevent row click
		e.stopPropagation();
		
		// Set the toggling node ID to show loading indicator
		setTogglingNodeId(nodeId);
		
		// Use setTimeout to ensure the UI updates with the loading state before performing the potentially expensive operation
		setTimeout(() => {
			setCategoryTree(prevTree => {
				// Create a deep copy function for the tree nodes
				const deepCopyNode = (node: CategoryTreeNode): CategoryTreeNode => {
					return {
						...node,
						children: node.children.map(child => deepCopyNode(child))
					};
				};
				
				// Create a deep copy of the entire tree
				const newTree = prevTree.map(node => deepCopyNode(node));
				
				// Function to find and toggle the specific node
				const toggleNode = (nodes: CategoryTreeNode[]): boolean => {
					for (let i = 0; i < nodes.length; i++) {
						if (nodes[i].id === nodeId) {
							nodes[i].isExpanded = !nodes[i].isExpanded;
							console.log(`Toggled node ${nodes[i].name} to ${nodes[i].isExpanded ? 'expanded' : 'collapsed'}`);
							return true;
						}
						if (nodes[i].children.length > 0) {
							if (toggleNode(nodes[i].children)) {
								return true;
							}
						}
					}
					return false;
				};
				
				toggleNode(newTree);
				return newTree;
			});
			
			// Clear the toggling node ID after the state update
			setTogglingNodeId(null);
		}, 100);
	};

	// Handle searching in tree structure
	const filterCategories = () => {
		if (!searchQuery.trim()) return categoryTree;
		
		const searchLower = searchQuery.toLowerCase();
		
		// Flatten the tree for searching
		const flattenTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
			let result: CategoryTreeNode[] = [];
			nodes.forEach(node => {
				if (node.name.toLowerCase().includes(searchLower) || 
					(node.description && node.description.toLowerCase().includes(searchLower))) {
					result.push({...node, children: flattenTree(node.children)});
				} else if (node.children.length > 0) {
					const filteredChildren = flattenTree(node.children);
					if (filteredChildren.length > 0) {
						result.push({...node, children: filteredChildren, isExpanded: true});
					}
				}
			});
			return result;
		};
		
		return flattenTree(categoryTree);
	};

	const filteredCategoryTree = filterCategories();

	// Recursive component to render the category tree
	const renderCategoryNode = (node: CategoryTreeNode, depth: number = 0) => {
		const hasChildren = node.children && node.children.length > 0;
		
		return (
			<React.Fragment key={node.id}>
				<tr className="hover:bg-gray-100 dark:hover:bg-gray-700">
					<td className="px-6 py-4 whitespace-nowrap">
						<div className="flex items-center">
							<div 
								style={{ paddingLeft: `${depth * 20}px` }}
								className="flex items-center"
							>
								{hasChildren ? (
									<button 
										onClick={(e) => toggleExpand(node.id, e)}
										className="mr-2 focus:outline-none"
										disabled={togglingNodeId === node.id}
									>
										{togglingNodeId === node.id ? (
											<Loader2Icon className="h-4 w-4 text-green-500 animate-spin" />
										) : node.isExpanded ? (
											<ChevronDown className="h-4 w-4 text-gray-500" />
										) : (
											<ChevronRight className="h-4 w-4 text-gray-500" />
										)}
									</button>
								) : (
									<div className="w-4 mr-2"></div>
								)}
								<div className="h-8 w-8 rounded bg-green-100 dark:bg-green-900 flex items-center justify-center">
									<FolderIcon className="h-4 w-4 text-green-600 dark:text-green-400" />
								</div>
								<div className="ml-4">
									<div className="text-sm font-medium text-gray-900 dark:text-white">
										{node.name}
									</div>
									{node.description && (
										<div 
											className="text-xs text-gray-500 dark:text-gray-400"
											title={node.description}
										>
											{node.description.length > 50
												? `${node.description.substring(0, 50)}...`
												: node.description}
										</div>
									)}
								</div>
							</div>
						</div>
					</td>
					<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
						{node.hero_image ? (
							<div className="flex items-center">
								<div className="h-12 w-20 overflow-hidden rounded">
									<img 
										src={node.hero_image} 
										alt={`${node.name} hero`}
										className="h-full w-full object-cover"
									/>
								</div>
							</div>
						) : (
							<span className="text-gray-400 dark:text-gray-500 italic text-xs">No hero image</span>
						)}
					</td>
					<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
						{format(
							new Date(node.created_at),
							"MM/dd/yyyy"
						)}
					</td>
					<td className="px-6 py-4 whitespace-nowrap text-sm text-center">
						<button
							onClick={() => navigate(`/productCategoryEdit/${node.id}`)}
							className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300 focus:outline-none"
							title="Edit Category"
						>
							<EditIcon className="h-5 w-5" />
						</button>
					</td>
				</tr>
				{node.isExpanded && node.children.map(child => 
					renderCategoryNode(child, depth + 1)
				)}
			</React.Fragment>
		);
	};

	return (
		<Layout
			pageInfo={{
				title: "Manage Product Categories",
				icon: FolderIcon,
				iconColor: "text-green-600 dark:text-green-500",
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
										className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-900 hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
										onClick={() =>
											navigate("/productCategoryEdit")
										}
									>
										<PlusIcon className="h-4 w-4 mr-2" />
										Add
									</button>
								</div>
							</div>
						</div>

						{totalPages > 1 && (
							<Pagination
								currentPage={currentPage}
								onPageChange={setCurrentPage}
								canPaginateNext={currentPage < totalPages}
								totalPages={totalPages}
							/>
						)}

						<div className="overflow-x-auto">
							<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
								<thead className="bg-gray-50 dark:bg-gray-900">
									<tr>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Category
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Hero Image
										</th>
										<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Created
										</th>
										<th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
											Actions
										</th>
									</tr>
								</thead>
								<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
									{loading ? (
										<LoadingModal
											isOpen={loading}
											message="Loading categories..."
										/>
									) : filteredCategoryTree.length === 0 ? (
										<tr>
											<td
												colSpan={4}
												className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400"
											>
												No categories found
											</td>
										</tr>
									) : (
										filteredCategoryTree.map(category => 
											renderCategoryNode(category)
										)
									)}
								</tbody>
							</table>
						</div>

						{totalPages > 1 && (
							<Pagination
								currentPage={currentPage}
								onPageChange={setCurrentPage}
								canPaginateNext={currentPage < totalPages}
								totalPages={totalPages}
							/>
						)}
					</div>
				</div>
			</div>
		</Layout>
	);
} 