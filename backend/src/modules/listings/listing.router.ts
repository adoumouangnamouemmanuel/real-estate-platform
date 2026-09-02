import { Router } from "express";
import { z } from "zod";
import type { RequestHandler } from "express";
import * as listingController from "./listing.controller.js";
import { authenticate, authorize } from "../../middleware/auth.js";

const router = Router();
const authenticateHandler = authenticate as unknown as RequestHandler;
const developerOnly = authorize("PROPERTY_DEVELOPER") as unknown as RequestHandler;

function validate(schema: z.ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({ success: false, message: "Validation failed", code: "VALIDATION_ERROR", errors: result.error.issues.map(i => ({ field: i.path.join("."), message: i.message })) });
      return;
    }
    req.body = result.data;
    next();
  };
}

const bulkStatusSchema = z.object({ ids: z.array(z.string()).min(1), status: z.enum(["ACTIVE", "RESERVED", "SOLD", "SUSPENDED"]) });
const bulkDeleteSchema = z.object({ ids: z.array(z.string()).min(1) });
const statusUpdateSchema = z.object({ status: z.enum(["ACTIVE", "RESERVED", "SOLD", "SUSPENDED"]) });

router.get("/counts", authenticateHandler, developerOnly, listingController.getStatusCounts);
router.patch("/bulk-status", authenticateHandler, developerOnly, validate(bulkStatusSchema), listingController.bulkUpdateStatus);
router.post("/bulk-delete", authenticateHandler, developerOnly, validate(bulkDeleteSchema), listingController.bulkDelete);
router.get("/", authenticateHandler, developerOnly, listingController.getListings);
router.get("/:id", authenticateHandler, developerOnly, listingController.getListingForEdit);
router.post("/", authenticateHandler, developerOnly, listingController.createListing);
router.patch("/:id", authenticateHandler, developerOnly, listingController.updateListing);
router.patch("/:id/status", authenticateHandler, developerOnly, validate(statusUpdateSchema), listingController.updateListingStatus);
router.delete("/:id", authenticateHandler, developerOnly, listingController.deleteListing);

export default router;
