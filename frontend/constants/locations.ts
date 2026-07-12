// TODO(backend): derive from distinct cities with active listings once GET /api/v1/properties exists.
export const CITIES = ["Accra", "Kumasi", "Takoradi", "Tema"] as const;

export type City = (typeof CITIES)[number];
