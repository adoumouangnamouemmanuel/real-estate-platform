import { databaseContext, prisma } from "../config/prisma.js";
import { BadRequestError } from "../utils/errors.js";
export async function localeConfig() {
  const [settings, languages] = await Promise.all([
    prisma.appSettings.findUniqueOrThrow({ where: { id: 1 } }),
    prisma.language.findMany({
      where: { isActive: true },
      select: { code: true },
    }),
  ]);
  const requested =
    databaseContext.getStore()?.lang ?? settings.defaultLanguageCode;
  if (!languages.some((l) => l.code === requested))
    throw new BadRequestError("Unsupported language", "UNSUPPORTED_LANGUAGE");
  return { requested, fallback: settings.fallbackLanguageCode };
}
export function resolveTranslation<
  T extends { languageCode: string; isPublished?: boolean },
>(
  rows: T[],
  requested: string,
  fallback: string,
  source?: string | null,
): T | undefined {
  for (const language of [...new Set([requested, fallback, source])]) {
    const row = rows.find(
      (r) => r.languageCode === language && r.isPublished !== false,
    );
    if (row) return row;
  }
}
export function localeMetadata(requested: string, resolved?: string | null) {
  return {
    requestedLanguage: requested,
    contentLanguage: resolved ?? null,
    fallbackUsed: requested !== resolved,
  };
}
export function normalizeCategory(value?: string): any {
  if (!value) return undefined;
  const category = value.toUpperCase();
  if (
    !["APARTMENT", "HOUSE", "LAND", "COMMERCIAL", "OFFICE"].includes(category)
  )
    throw new BadRequestError("Invalid category", "INVALID_CATEGORY");
  return category;
}
