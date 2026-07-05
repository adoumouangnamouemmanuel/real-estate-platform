/**
 * database/seeds/locations.seed.ts
 *
 * Seeds the City/District lookup tables. Per README §2.4/§2.5, cities and
 * districts are added by Admins, not by sellers — so this is the canonical
 * starter list for Burkina Faso's two largest cities, matching the example
 * district names given in the README itself (Zone du Bois, Dafra, Koulouba,
 * Gounghin).
 */

import { PrismaClient } from '@prisma/client';

export interface SeededLocations {
  cities: { id: string; name: string }[];
  districts: { id: string; cityId: string; name: string }[];
}

const CITY_DEFINITIONS = [
  {
    name: 'Ouagadougou',
    districts: ['Zone du Bois', 'Koulouba', 'Gounghin', 'Ouaga 2000'],
  },
  {
    name: 'Bobo-Dioulasso',
    districts: ['Dafra', 'Accart-Ville', 'Sikasso-Cira'],
  },
];

export async function seedLocations(prisma: PrismaClient): Promise<SeededLocations> {
  const cities: SeededLocations['cities'] = [];
  const districts: SeededLocations['districts'] = [];

  for (const cityDef of CITY_DEFINITIONS) {
    const city = await prisma.city.upsert({
      where: { name: cityDef.name },
      update: {},
      create: { name: cityDef.name },
    });
    cities.push({ id: city.id, name: city.name });

    for (const districtName of cityDef.districts) {
      const district = await prisma.district.upsert({
        where: { cityId_name: { cityId: city.id, name: districtName } },
        update: {},
        create: { cityId: city.id, name: districtName },
      });
      districts.push({ id: district.id, cityId: city.id, name: district.name });
    }
  }

  return { cities, districts };
}
