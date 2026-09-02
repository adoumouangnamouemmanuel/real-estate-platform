import { createRequire } from "node:module";
const req = createRequire(import.meta.url);
// The schema's custom output path redirects the generated client to
// backend/node_modules/.prisma/client — this CJS require is the
// reliable way to load it from an ESM project.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PrismaClient } = req("../../node_modules/.prisma/client/index.js");

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type PC = InstanceType<typeof PrismaClient>;

const globalForPrisma = globalThis as unknown as { prisma: PC };

export const prisma: PC = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
