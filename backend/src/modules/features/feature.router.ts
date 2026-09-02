import { Router } from "express";
import * as featureController from "./feature.controller.js";

const router = Router();
router.get("/", featureController.getFeatures);

export default router;
