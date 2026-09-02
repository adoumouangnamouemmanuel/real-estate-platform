import { Router } from "express";
import type { RequestHandler } from "express";
import * as favoriteController from "./favorite.controller.js";
import { authenticate } from "../../middleware/auth.js";

const router = Router();
const authenticateHandler = authenticate as unknown as RequestHandler;

router.get("/", authenticateHandler, favoriteController.getFavorites);
router.post("/:propertyId", authenticateHandler, favoriteController.toggleFavorite);

export default router;
