import express from "express";
import cors from "cors";
import { config } from "dotenv";
import { logger } from "./logging/logger";
import { httpLogger } from "./logging/httpLogger";
import { globalErrorHandler } from "./middleware/errorHandler";
import { correlationIdMiddleware } from "./middleware/correlationId";
import apiRoutes from "./routes/apiRoutes";

// Load environment variables
config();

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

// Core middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Observability middleware
app.use(correlationIdMiddleware);
app.use(httpLogger);

// Health check (excluded from logging)
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// API routes
app.use("/api", apiRoutes);

// Global error handler (MUST be last)
app.use(globalErrorHandler);

// Start server
app.listen(PORT, () => {
  logger.info({ port: PORT, env: NODE_ENV }, `Server running on port ${PORT}`);
});

export default app;
