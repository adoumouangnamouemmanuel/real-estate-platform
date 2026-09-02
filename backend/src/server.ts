import dotenv from "dotenv";
dotenv.config({ override: true });
import { createApp } from "./app.js";
import { getEnv } from "./config/env.js";
import { prisma } from "./config/prisma.js";

async function main() {
  const env = getEnv();
  const app = createApp();

  try {
    await prisma.$connect();
    console.log("✅ Database connected");
  } catch (err) {
    console.error("❌ Database connection failed:", err);
    process.exit(1);
  }

  app.listen(env.PORT, () => {
    console.log(`🚀 Backend API running on http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   Health check: http://localhost:${env.PORT}/api/health`);
  });
}

main().catch((err) => {
  console.error("❌ Server failed to start:", err);
  process.exit(1);
});
