import "react";

export function Footer() {
	return (
		<footer className="bottom-0 left-0 right-0 z-50 bg-white/90 dark:bg-gray-800/90 shadow-lg backdrop-blur-sm p-4 text-center text-gray-700 dark:text-gray-200">
			&copy; {new Date().getFullYear()} Free Carver, LLC. All rights
			reserved.
		</footer>
	);
}

export default Footer;
