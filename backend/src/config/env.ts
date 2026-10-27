import { z } from "zod";

const envSchema = z.object({
  TRUST_PROXY_HOPS: z.coerce.number().int().min(0).max(3).default(0),
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url().optional(),

  SUPABASE_URL: z.string().url(),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_STORAGE_KEY: z.string().optional(),
  AUTH_REDIRECT_URL: z.string().url().optional(),

  JWT_SECRET: z.string().min(16).optional(),
  JWT_EXPIRES_IN: z.string().default("15m"),

  REFRESH_TOKEN_SECRET: z.string().min(16).optional(),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().default(7),
  AUTH_COOKIE_NAME: z.string().default("refresh_token"),

  CONTENT_READ_MODE: z.enum(["localized", "legacy"]).default("localized"),
  CORS_ORIGIN: z.string().default("http://localhost:3000"),
});

export type Env = z.infer<typeof envSchema>;

let _env: Env | null = null;

export function getEnv(): Env {
  if (!_env) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      console.error("Error@lumavok: Invalid environment variables:");
      console.error(
        result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          code: issue.code,
        })),
      );
      process.exit(1);
    }
    _env = result.data;
  }
  return _env;
}
