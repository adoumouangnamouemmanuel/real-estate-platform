/** Live choices come from useLocations / GET /locations. */
export const CITIES: readonly string[] = [];
export type City = string;
export const DISTRICTS: Record<string, string[]> = {};
export const CITY_REGIONS: Record<string, string> = {};
export function getDistrictsForCity(_city: string | undefined): string[] {
  void _city;
  return [];
}
export function getRegionForCity(
  _city: string | undefined,
): string | undefined {
  void _city;
  return undefined;
}
