import { Router } from "express";
import type { RequestHandler } from "express";
import * as notificationController from "./notification.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = Router();
const authenticateHandler = authenticate as unknown as RequestHandler;
const developerOnly = authorize("PROPERTY_DEVELOPER") as unknown as RequestHandler;

router.get("/unread-count", authenticateHandler, developerOnly, notificationController.getUnreadCount);
router.patch("/read-all", authenticateHandler, developerOnly, notificationController.markAllAsRead);
router.get("/", authenticateHandler, developerOnly, notificationController.getNotifications);
router.patch("/:id/read", authenticateHandler, developerOnly, notificationController.markAsRead);

export default router;
