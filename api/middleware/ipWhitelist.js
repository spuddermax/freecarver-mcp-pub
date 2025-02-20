// /api/middleware/ipWhitelist.js

import { logger } from "./logger.js";

function ipWhitelistMiddleware(req, res, next) {
	// Get the client IP:
	// If behind a proxy, use the `X-Forwarded-For` header.
	// Otherwise, fall back to req.socket.remoteAddress.
	const rawClientIp =
		req.headers["x-forwarded-for"]?.split(",")[0].trim() ||
		req.socket.remoteAddress;

	// Normalize IPv4 addresses that are represented in IPv6 format.
	let clientIp = rawClientIp;
	if (clientIp && clientIp.startsWith("::ffff:")) {
		clientIp = clientIp.substring(7);
	}

	// Define the allowed IPs.
	// You can load these values from a configuration file or environment variables as needed.
	const allowedIps = [
		"127.0.0.1",
		"192.168.0.115",
		"73.124.213.245",
		"64.72.222.107",
	]; // Replace with your specific IP addresses.
	// If the client's IP is not on the whitelist, send a JSON response.
	if (!allowedIps.includes(clientIp)) {
		// Log the unauthorized access attempt.
		logger.error(`IP ${clientIp} is not on the whitelist`);
		return res.status(401).json({ error: "Unauthorized" });
	}

	// Otherwise, pass the request to the next middleware/route handler.
	next();
}

export default ipWhitelistMiddleware;
