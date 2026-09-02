import { Router } from "express";
import { z } from "zod";
import type { RequestHandler } from "express";
import * as authController from "./auth.controller.js";
import { authenticate } from "../../middleware/auth.js";
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from "./auth.schema.js";

const router = Router();

function validate(schema: z.ZodSchema): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        success: false,
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }
    req.body = result.data;
    next();
  };
}

const authenticateHandler = authenticate as unknown as RequestHandler;

router.post("/login", validate(loginSchema), authController.login);
router.post("/register", validate(registerSchema), authController.register);
router.post("/refresh", authController.refresh);
router.post("/logout", authenticateHandler, authController.logout);
router.post("/forgot-password", validate(forgotPasswordSchema), authController.forgotPassword);
router.post("/reset-password", validate(resetPasswordSchema), authController.resetPassword);
router.get("/reset-password/:token", authController.validateResetToken);

export default router;
