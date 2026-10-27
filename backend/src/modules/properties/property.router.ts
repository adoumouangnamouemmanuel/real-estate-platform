import { Router } from "express";
import * as propertyController from "./property.controller.js";

const router = Router();

router.get("/", propertyController.getProperties);
router.get("/by-id/:id", propertyController.getPropertyById);
router.get("/:slug", propertyController.getPropertyBySlug);
router.get("/:id/related", propertyController.getRelatedProperties);

export default router;
