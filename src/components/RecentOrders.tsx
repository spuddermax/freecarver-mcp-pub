// RecentOrders.tsx
import { useState, useEffect } from "react";
import { fetchOrders, OrdersPaginationOptions } from "../lib/api_client/orders";
import { Loader2 } from "lucide-react";

function RecentOrders() {
	const [orders, setOrders] = useState<any[]>([]);
	const [loading, setLoading] = useState<boolean>(true);

	useEffect(() => {
		async function loadOrders() {
			setLoading(true);
			try {
				const options: OrdersPaginationOptions = {
					limit: 10,
					orderBy: "created_at",
					order: "desc",
				};
				const orders = await fetchOrders(options);
				setOrders(orders);
			} catch (error) {
				console.error("Failed to fetch recent orders", error);
			} finally {
				setLoading(false);
			}
		}
		loadOrders();
	}, []);

	return (
		<div className="lg:col-span-2 bg-white dark:bg-gray-800 shadow rounded-lg">
			<div className="p-6">
				<h3 className="text-lg font-medium text-gray-900 dark:text-white">
					Recent Orders
				</h3>
				<div className="mt-6">
					<table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
						<thead>
							<tr>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Order ID
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Customer
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Product
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Status
								</th>
								<th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
									Amount
								</th>
							</tr>
						</thead>
						<tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
							{orders.map((order, index) => (
								<tr key={index}>
									<td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
										{order.id}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
										{order.customer_name ||
											order.customer_id}
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
										{order.product_name || "N/A"}
									</td>
									<td className="px-6 py-4 whitespace-nowrap">
										<span
											className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
												order.status === "Delivered"
													? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
													: order.status ===
													  "Processing"
													? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
													: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
											}`}
										>
											{order.status}
										</span>
									</td>
									<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
										${order.order_total}
									</td>
								</tr>
							))}
							{loading ? (
								<tr>
									<td
										colSpan={5}
										className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center"
									>
										<div className="flex items-center justify-center">
											<Loader2 className="h-5 w-5 text-blue-500 animate-spin mr-2" />
											<span>
												Loading recent orders...
											</span>
										</div>
									</td>
								</tr>
							) : (
								orders.length === 0 && (
									<tr>
										<td
											colSpan={5}
											className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 text-center"
										>
											No recent orders found.
										</td>
									</tr>
								)
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}

export default RecentOrders;
