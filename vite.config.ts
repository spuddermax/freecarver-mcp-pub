import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	optimizeDeps: {
		exclude: ["lucide-react"],
	},
	server: {
		hmr: true,
		https: {
			key: "/etc/ssl/certs/freecarver-key.pem",
			cert: "/etc/ssl/certs/freecarver-cert.crt",
		},
	},
	build: {
		sourcemap: false,
	},
});
