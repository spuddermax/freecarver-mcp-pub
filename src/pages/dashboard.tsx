import "react";
import {
	HomeIcon,
	ShoppingBag,
	Users,
	TrendingUp,
	DollarSign,
} from "lucide-react";
import Layout from "../components/Header";
import RecentOrders from "../components/RecentOrders";
import { DashboardQuickActions } from "../components/DashboardQuickActions";

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
	return (
		<Layout
			pageInfo={{
				title: "Dashboard",
				icon: HomeIcon,
				iconColor: "text-green-500 dark:text-green-400",
			}}
		>
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
					<DashboardQuickActions />
				</div>
			</div>
		</Layout>
	);
}
