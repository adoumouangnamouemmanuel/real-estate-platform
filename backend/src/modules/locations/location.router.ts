import { Router } from "express";
import { prisma } from "../../config/prisma.js";
import { sendSuccess } from "../../utils/response.js";
const router = Router();
router.get("/", async (_req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      include: {
        districts: { where: { isActive: true }, orderBy: { name: "asc" } },
      },
    });
    sendSuccess(
      res,
      cities.map((c) => ({
        id: c.id,
        name: c.name,
        countryCode: c.countryCode,
        districts: c.districts.map((d) => ({
          id: d.id,
          name: d.name,
          cityId: d.cityId,
        })),
      })),
    );
  } catch (error) {
    next(error);
  }
});
export default router;
