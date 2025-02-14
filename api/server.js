// /api/server.js

import app from "./app.js";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	logger.info(`Server is running on port ${PORT}`);
});
