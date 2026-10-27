import { Router, type RequestHandler } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma.js";
import { authenticate, authorize } from "../../middleware/auth.js";
import { sendSuccess } from "../../utils/response.js";
import { BadRequestError, NotFoundError } from "../../utils/errors.js";
import type { AuthenticatedRequest } from "../../types/index.js";
const router = Router();
router.use(authenticate as unknown as RequestHandler);
const schema = z
  .object({
    businessName: z.string().trim().min(1).max(120),
    cityId: z.string().min(1),
    phoneNumber: z.string().min(5).max(30),
    whatsappNumber: z.string().min(5).max(30),
  })
  .strict();
router.get(
  "/pending",
  authorize("ADMIN") as unknown as RequestHandler,
  async (_req, res, next) => {
    try {
      const profiles = await prisma.propertyDeveloper.findMany({
        where: { sellerStatus: "PENDING", deletedAt: null },
        select: {
          id: true,
          businessName: true,
          city: true,
          userId: true,
          createdAt: true,
        },
        take: 100,
        orderBy: { createdAt: "asc" },
      });
      sendSuccess(res, profiles);
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/request",
  authorize("USER") as unknown as RequestHandler,
  async (req, res, next) => {
    try {
      const input = schema.parse(req.body),
        actor = (req as AuthenticatedRequest).user;
      const city = await prisma.city.findFirst({
        where: { id: input.cityId, isActive: true },
      });
      if (!city) throw new BadRequestError("City not found");
      const profile = await prisma.propertyDeveloper.create({
        data: {
          userId: actor.userId,
          ...input,
          city: city.name,
          slug: "seller-" + actor.userId,
          sellerStatus: "PENDING",
          profileImageUrl: "",
          profileImagePublicId: "",
        },
      });
      sendSuccess(
        res,
        { id: profile.id, sellerStatus: profile.sellerStatus },
        201,
      );
    } catch (error) {
      next(error);
    }
  },
);
router.post(
  "/:id/activate",
  authorize("ADMIN") as unknown as RequestHandler,
  async (req, res, next) => {
    try {
      const result = await prisma.$transaction(async (tx) => {
        await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${"seller:" + String(req.params.id)},0))::text`;
        const profile = await tx.propertyDeveloper.findFirst({
          where: { id: req.params.id as string, deletedAt: null },
        });
        if (!profile) throw new NotFoundError("Seller not found");
        if (profile.sellerStatus !== "PENDING")
          throw new BadRequestError("Seller is not pending");
        await tx.propertyDeveloper.update({
          where: { id: profile.id },
          data: {
            sellerStatus: "ACTIVE",
            activatedAt: new Date(),
            activatedByUserId: (req as AuthenticatedRequest).user.userId,
          },
        });
        await tx.user.update({
          where: { id: profile.userId },
          data: { role: "PROPERTY_DEVELOPER" },
          select: { id: true },
        });
        return { id: profile.id, sellerStatus: "ACTIVE" };
      });
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },
);
export default router;
