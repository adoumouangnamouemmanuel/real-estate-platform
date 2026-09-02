import { Router } from "express";
import type { RequestHandler } from "express";
import * as analyticsController from "./analytics.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = Router();
const authenticateHandler = authenticate as unknown as RequestHandler;
const developerOnly = authorize("PROPERTY_DEVELOPER") as unknown as RequestHandler;

router.get("/", authenticateHandler, developerOnly, analyticsController.getSnapshot);

export default router;
