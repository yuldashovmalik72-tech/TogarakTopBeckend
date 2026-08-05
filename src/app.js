import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import path from "path";
import swaggerUi from "swagger-ui-express";

import env from "./config/env.js";
import swaggerDocument from "./config/swagger.js";
import routes from "./routes/index.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";

const app = express();

// Swagger UI uchun CSP biroz yumshatiladi
app.use(
  helmet({
    contentSecurityPolicy: env.nodeEnv === "production" ? undefined : false,
  })
);
app.use(
  cors({
    origin: env.clientUrl,
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

if (env.nodeEnv === "development") {
  app.use(morgan("dev"));
}

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", limiter);

app.use(`/${env.upload.dir}`, express.static(path.join(process.cwd(), env.upload.dir)));

app.get("/health", (req, res) => res.json({ status: "OK", time: new Date().toISOString() }));

// ========== SWAGGER (OpenAPI) ==========
// Brauzer: http://localhost:5000/api-docs
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerDocument, {
    customSiteTitle: "Togarak API Docs",
    customCss: ".swagger-ui .topbar { display: none }",
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: "list",
      filter: true,
      tryItOutEnabled: true,
    },
  })
);
// Raw OpenAPI JSON
app.get("/api-docs.json", (req, res) => {
  res.json(swaggerDocument);
});

app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;
