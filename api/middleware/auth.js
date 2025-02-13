// /api/middleware/auth.js

import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

function verifyJWT(req, res, next) {
	const authHeader = req.headers["authorization"];
	if (!authHeader)
		return res.status(401).json({ error: "No token provided" });

	// Expect header format: "Bearer <token>"
	const token = authHeader.split(" ")[1];
	if (!token) return res.status(401).json({ error: "Token missing" });

	jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
		if (err) return res.status(401).json({ error: "Invalid token" });
		// Attach the decoded token (admin details) to the request object
		req.admin = decoded;
		next();
	});
}

export { verifyJWT };
