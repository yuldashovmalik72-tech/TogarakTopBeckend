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

// Helmet: Cross-Origin-Resource-Policy ni cross-origin qilamiz,
// aks holda frontend (Vercel) dan backend (Render) rasmlari
// ERR_BLOCKED_BY_RESPONSE.NotSameOrigin bilan bloklanadi.
app.use(
  helmet({
    contentSecurityPolicy: env.nodeEnv === "production" ? undefined : false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginEmbedderPolicy: false,
  })
);

// CLIENT_URL bitta yoki vergul bilan bir nechta (masalan Vercel + localhost)
const allowedOrigins = String(env.clientUrl || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // same-origin / curl / server-to-server
      if (!origin) return cb(null, true);
      if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return cb(null, true);
      }
      // developmentda qulaylik
      if (env.nodeEnv !== "production") return cb(null, true);
      return cb(new Error(`CORS blocked: ${origin}`));
    },
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

// Static uploads — boshqa domen (frontend) dan ochilishi uchun headerlar
app.use(
  `/${env.upload.dir}`,
  express.static(path.join(process.cwd(), env.upload.dir), {
    setHeaders(res) {
      res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Cache-Control", "public, max-age=86400");
    },
  })
);

app.get("/health", (req, res) => res.json({ status: "OK", time: new Date().toISOString() }));

// ========== SWAGGER (OpenAPI) ==========
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

app.get("/api-docs.json", (req, res) => {
  res.json(swaggerDocument);
});

app.use("/api", routes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;