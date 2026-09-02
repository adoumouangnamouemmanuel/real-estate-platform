import { Router } from "express";
import { z } from "zod";
import type { RequestHandler } from "express";
import * as appointmentController from "./appointment.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = Router();
const authenticateHandler = authenticate as unknown as RequestHandler;
const developerOnly = authorize("PROPERTY_DEVELOPER") as unknown as RequestHandler;

function validate(schema: z.ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) { res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR", errors: result.error.issues.map(i => ({ field: i.path.join("."), message: i.message })) }); return; }
    req.body = result.data; next();
  };
}

router.get("/counts", authenticateHandler, developerOnly, appointmentController.getStatusCounts);
router.patch("/bulk-status", authenticateHandler, developerOnly, validate(z.object({ ids: z.array(z.string()).min(1), status: z.enum(["CONFIRMED", "CANCELLED"]) })), appointmentController.bulkUpdateStatus);
router.get("/", authenticateHandler, developerOnly, appointmentController.getAppointments);
router.get("/:id", authenticateHandler, developerOnly, appointmentController.getAppointment);
router.patch("/:id/status", authenticateHandler, developerOnly, validate(z.object({ status: z.enum(["CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"]) })), appointmentController.updateStatus);
router.patch("/:id/reschedule", authenticateHandler, developerOnly, validate(z.object({ scheduledFor: z.string().min(1) })), appointmentController.reschedule);

export default router;
