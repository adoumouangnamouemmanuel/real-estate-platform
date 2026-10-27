import express from "express";
import { rateLimit } from "express-rate-limit";
import { BadRequestError, ForbiddenError } from "./utils/errors.js";
import { databaseContext } from "./config/prisma.js";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { getEnv } from "./config/env.js";
import locationRouter from "./modules/locations/location.router.js";
import sellerRouter from "./modules/sellers/seller.router.js";
import authRouter from "./modules/auth/auth.router.js";
import propertyRouter from "./modules/properties/property.router.js";
import listingRouter from "./modules/listings/listing.router.js";
import developerRouter from "./modules/developers/developer.router.js";
import appointmentRouter from "./modules/appointments/appointment.router.js";
import notificationRouter from "./modules/notifications/notification.router.js";
import analyticsRouter from "./modules/analytics/analytics.router.js";
import dashboardRouter from "./modules/dashboard/dashboard.router.js";
import uploadRouter from "./modules/uploads/upload.router.js";
import favoriteRouter from "./modules/favorites/favorite.router.js";
import featureRouter from "./modules/features/feature.router.js";
import { errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const env = getEnv();
  const app = express();
  app.set("trust proxy", env.TRUST_PROXY_HOPS);

  app.use(helmet());
  app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
  });
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "1mb", inflate: false }));
  app.use(cookieParser());
  app.use((req, _res, next) => {
    if (
      !["GET", "HEAD", "OPTIONS"].includes(req.method) &&
      req.headers.origin &&
      req.headers.origin !== env.CORS_ORIGIN
    )
      return next(new ForbiddenError("Origin is not allowed"));
    next();
  });
  app.use(
    "/api/v1/auth",
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 50,
      standardHeaders: "draft-8",
      legacyHeaders: false,
      validate: { xForwardedForHeader: false },
    }),
  );

  app.use((req, _res, next) => {
    if (req.query.lang !== undefined && typeof req.query.lang !== "string")
      return next(
        new BadRequestError(
          "Invalid language parameter",
          "UNSUPPORTED_LANGUAGE",
        ),
      );
    databaseContext.run(
      { actor: {}, lang: req.query.lang as string | undefined },
      next,
    );
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/sellers", sellerRouter);
  app.use("/api/v1/properties", propertyRouter);
  // /me/* routes MUST come before /api/v1/developers to prevent Express from
  // matching the generic /:id or /:slug params in the developer router.
  app.use("/api/v1/developers/me/listings", listingRouter);
  app.use("/api/v1/developers/me/appointments", appointmentRouter);
  app.use("/api/v1/developers/me/notifications", notificationRouter);
  app.use("/api/v1/developers/me/analytics", analyticsRouter);
  app.use("/api/v1/developers/me/dashboard", dashboardRouter);
  app.use("/api/v1/developers", developerRouter);
  app.use("/api/v1/uploads", uploadRouter);
  app.use("/api/v1/favorites", favoriteRouter);
  app.use("/api/v1/features", featureRouter);
  app.use("/api/v1/locations", locationRouter);

  app.use((_req, res) => {
    res.status(404).json({
      success: false,
      message: "Endpoint not found",
      code: "NOT_FOUND",
    });
  });

  app.use(errorHandler);

  return app;
}
