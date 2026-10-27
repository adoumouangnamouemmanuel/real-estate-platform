import dotenv from "dotenv";
dotenv.config({ override: true });
import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { prisma, assertRuntimeRole } from "./config/prisma.js";

async function main() {
  const env = getEnv();
  const app = createApp();

  try {
    await prisma.$connect();
    await assertRuntimeRole();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("Database startup validation failed");
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Health check: http://localhost:${env.PORT}/api/health`);
  });
}

main().catch((err) => {
  console.error("Server failed to start");
  process.exit(1);
});
