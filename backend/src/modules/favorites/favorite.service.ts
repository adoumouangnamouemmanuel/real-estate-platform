import { prisma } from "../../config/prisma.js";
import { NotFoundError, UnauthorizedError } from "../../utils/errors.js";
import { publicPropertyWhere } from "../properties/property.service.js";
export async function getFavorites(userId: string) {
  if (!userId) throw new UnauthorizedError();
  const items = await prisma.propertyFavorite.findMany({
    where: { userId },
    select: { propertyId: true },
  });
  return { ids: items.map((f) => f.propertyId), countDeltas: {} };
}
export async function toggleFavorite(userId: string, propertyId: string) {
  if (!userId) throw new UnauthorizedError();
  return prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(hashtextextended(${"favorite:" + userId + ":" + propertyId},0))::text`;
    const old = await tx.propertyFavorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
    if (
      !old &&
      !(await tx.property.findFirst({
        where: { ...publicPropertyWhere, id: propertyId },
        select: { id: true },
      }))
    )
      throw new NotFoundError("Property not found");
    if (old) await tx.propertyFavorite.delete({ where: { id: old.id } });
    else await tx.propertyFavorite.create({ data: { userId, propertyId } });
    // The private database trigger maintains the counter atomically.
    return { ...(await getFavorites(userId)), added: !old };
  });
}
