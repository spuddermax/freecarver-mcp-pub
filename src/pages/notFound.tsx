import "react";
import { Link } from "react-router-dom";
import { Sun, Moon, Grid, Pause, Play, Bot } from "lucide-react";
import { useTheme } from "../lib/theme";
import { useGrid } from "../lib/grid";
import { TronGrid } from "../components/TronGrid/index";

interface NotFoundProps {
	session: any;
}

export default function NotFound({ session }: NotFoundProps) {
	const { theme, setTheme } = useTheme();
	const { showGrid, setShowGrid, animateGrid, setAnimateGrid } = useGrid();
	const isDark = theme === "dark";

	return (
		<div className="min-h-screen flex items-center justify-center p-4">
			{showGrid && <TronGrid />}
			<div className="w-full max-w-md">
				<div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8">
					<div className="text-center mb-8">
						<h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
							Free Carver MCP
						</h1>
						<p className="text-gray-600 dark:text-gray-400">
							Master Control Program
						</p>
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mt-4">
							404 - Page Not Found
						</h2>
						<Bot className="h-32 w-32 dark:text-orange-400 mt-2 mx-auto" />
						<p className="text-gray-600 dark:text-gray-400 mt-2">
							Keep moving, program!
						</p>
						{session && (
							<Link
								to="/dashboard"
								className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
							>
								Go to Dashboard
							</Link>
						)}
						<div className="mt-2 flex justify-center items-center space-x-4">
							<div className="relative group">
								<button
									onClick={() =>
										setTheme(isDark ? "light" : "dark")
									}
									className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
									aria-label={`Switch to ${
										isDark ? "light" : "dark"
									} mode`}
								>
									{isDark ? (
										<Moon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
									) : (
										<Sun className="h-5 w-5 text-gray-600 dark:text-gray-400" />
									)}
								</button>
								<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
									Switch to {isDark ? "light" : "dark"} mode
								</div>
							</div>
							<div className="relative group">
								<button
									onClick={() => {
										if (!showGrid) {
											setShowGrid(true);
											setAnimateGrid(true);
										} else {
											setAnimateGrid(!animateGrid);
										}
									}}
									className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
									aria-label={
										showGrid
											? animateGrid
												? "Pause grid"
												: "Resume grid"
											: "Show grid"
									}
								>
									<Grid
										className={`h-5 w-5 ${
											showGrid
												? "text-blue-500 dark:text-blue-400"
												: "text-gray-600 dark:text-gray-400"
										}`}
									/>
									{showGrid && (
										<div className="absolute bottom-1 right-1 bg-white dark:bg-gray-800 rounded-full p-0.5">
											{animateGrid ? (
												<Pause className="h-3 w-3 text-blue-500 dark:text-blue-400" />
											) : (
												<Play className="h-3 w-3 text-blue-500 dark:text-blue-400" />
											)}
										</div>
									)}
								</button>
								<div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap pointer-events-none">
									{showGrid
										? animateGrid
											? "Pause Grid"
											: "Resume Grid"
										: "Show Grid"}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
