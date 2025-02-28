// /api/middleware/ipWhitelist.js

import { logger } from "./logger.js";

// Import the ipaddr.js library for IP address manipulation
import ipaddr from "ipaddr.js";

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
	// Should also accept all ips in the 192.168.0.0/24 range
	const allowedIps = [
		"127.0.0.1",
		"73.124.213.245",
		"64.72.222.107",
		"192.168.0.0/24",
	];

	// Check if the client IP is allowed
	const isAllowed = allowedIps.some((allowedIp) => {
		// Check if the allowed IP is a subnet (contains a slash)
		if (allowedIp.includes("/")) {
			try {
				// Parse the subnet
				const [subnetAddress, prefixLength] = allowedIp.split("/");
				const subnet = ipaddr.parseCIDR(allowedIp);

				// Parse the client IP
				let clientIpAddress = clientIp;
				// Handle IPv4 mapped to IPv6 format (::ffff:192.168.0.1)
				if (clientIp.startsWith("::ffff:")) {
					clientIpAddress = clientIp.substring(7);
				}

				const parsedClientIp = ipaddr.parse(clientIpAddress);

				// Check if the client IP is in the subnet
				return parsedClientIp.match(subnet);
			} catch (error) {
				logger.error(`Error checking IP subnet: ${error.message}`);
				return false;
			}
		} else {
			// For non-subnet IPs, do an exact match
			// Handle IPv4 mapped to IPv6 format
			if (clientIp.startsWith("::ffff:")) {
				return clientIp.substring(7) === allowedIp;
			}
			return clientIp === allowedIp;
		}
	});

	if (!isAllowed) {
		// Log the unauthorized access attempt
		logger.error(`IP ${clientIp} is not on the whitelist`);
		return res.status(401).json({ error: "Unauthorized" });
	}

	// Otherwise, pass the request to the next middleware/route handler.
	next();
}

export default ipWhitelistMiddleware;
