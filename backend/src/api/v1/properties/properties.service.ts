/*
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export class PropertyService {
  static async createNewProperty(data: { title: string; price: number; developerId: string }) {
    // Business logic rule: Developers cannot list properties for free
    if (data.price <= 0) throw new Error('Price must be greater than zero');

    // Save to PostgreSQL using Clement's schema mapping
    return await prisma.property.create({ data });
  }
}
  */