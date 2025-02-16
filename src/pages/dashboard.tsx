import "react";
import { useNavigate } from "react-router-dom";
import {
	ShoppingBag,
	Users,
	Settings,
	Package,
	TrendingUp,
	DollarSign,
} from "lucide-react";
import Layout from "../components/Layout";
import RecentOrders from "../components/RecentOrders";

const stats = [
	{
		title: "Total Sales",
		value: "$12,345",
		icon: DollarSign,
		change: "+12%",
	},
	{ title: "Active Users", value: "1,234", icon: Users, change: "+8%" },
	{ title: "New Orders", value: "34", icon: ShoppingBag, change: "+23%" },
	{ title: "Revenue", value: "$3,456", icon: TrendingUp, change: "+15%" },
];

export default function Dashboard() {
	const navigate = useNavigate();

	return (
		<Layout>
			<div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
				{/* Stats Grid */}
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
					{stats.map((stat, index) => (
						<div
							key={index}
							className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg"
						>
							<div className="p-5">
								<div className="flex items-center">
									<div className="flex-shrink-0">
										<stat.icon className="h-6 w-6 text-gray-600 dark:text-gray-300" />
									</div>
									<div className="ml-5 w-0 flex-1">
										<dl>
											<dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
												{stat.title}
											</dt>
											<dd className="flex items-baseline">
												<div className="text-2xl font-semibold text-gray-900 dark:text-white">
													{stat.value}
												</div>
												<div className="ml-2 flex items-baseline text-sm font-semibold text-green-600 dark:text-green-400">
													{stat.change}
												</div>
											</dd>
										</dl>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>

				{/* Main Content */}
				<div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Recent Orders Section */}
					<RecentOrders />

					{/* Quick Actions */}
					<div className="bg-white dark:bg-gray-800 shadow rounded-lg">
						<div className="p-6">
							<h3 className="text-lg font-medium text-gray-900 dark:text-white">
								Quick Actions
							</h3>
							<div className="mt-6 space-y-4">
								{[
									{
										icon: Package,
										label: "Manage Products",
										onClick: () => navigate("/products"),
									},
									{
										icon: Users,
										label: "Manage Users",
										onClick: () => navigate("/users"),
									},
									{ icon: Settings, label: "Settings" },
								].map((action, index) => (
									<button
										key={index}
										onClick={action.onClick}
										className="w-full flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
									>
										<action.icon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
										<span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
											{action.label}
										</span>
									</button>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>
		</Layout>
	);
}
