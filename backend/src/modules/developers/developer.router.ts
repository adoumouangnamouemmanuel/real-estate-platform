import { Router } from "express";
import * as developerController from "./developer.controller.js";

const router = Router();
router.get("/", developerController.getDevelopers);
router.get("/:slug", developerController.getDeveloperBySlug);
router.get("/:id/listings", developerController.getDeveloperListings);

export default router;
