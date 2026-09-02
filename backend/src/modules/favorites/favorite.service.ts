import { prisma } from "../../config/prisma.js";
import { NotFoundError } from "../../utils/errors.js";

export async function getFavorites(userId: string) {
  const favorites = await prisma.propertyFavorite.findMany({ where: { userId }, select: { propertyId: true } });
  return { ids: favorites.map(f => f.propertyId), countDeltas: {} };
}

export async function toggleFavorite(userId: string, propertyId: string) {
  const property = await prisma.property.findUnique({ where: { id: propertyId }, select: { id: true } });
  if (!property) throw new NotFoundError("Property not found");

  const existing = await prisma.propertyFavorite.findUnique({ where: { userId_propertyId: { userId, propertyId } } });

  if (existing) {
    await prisma.propertyFavorite.delete({ where: { id: existing.id } });
    await prisma.property.update({ where: { id: propertyId }, data: { favoriteCount: { decrement: 1 } } });
  } else {
    await prisma.propertyFavorite.create({ data: { userId, propertyId } });
    await prisma.property.update({ where: { id: propertyId }, data: { favoriteCount: { increment: 1 } } });
  }

  const state = await getFavorites(userId);
  return { ...state, added: !existing };
}
