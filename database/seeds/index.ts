/**
 * database/seeds/index.ts
 *
 * Seed runner — orchestrates all seed scripts in dependency order.
 * Run with: npm run seed (from /database)
 *
 * Order matters:
 *   1. Lookup data (cities, districts, features) — nothing else can exist without these
 *   2. Admin/developer users — need to exist before properties reference them
 *   3. Properties — need a developer, a city, and optionally a district
 */

import { PrismaClient } from '@prisma/client';
import { seedLocations } from './locations.seed';
import { seedFeatures } from './features.seed';
import { seedDevelopers } from './developers.seed';
import { seedProperties } from './properties.seed';

const prisma = new PrismaClient();

async function main() {
  console.log(' Starting Lumavok database seed...\n');

  console.log('→ Seeding cities and districts...');
  const locations = await seedLocations(prisma);
  console.log(`  Created ${locations.cities.length} cities, ${locations.districts.length} districts.`);

  console.log('→ Seeding features (amenities)...');
  const features = await seedFeatures(prisma);
  console.log(`  Created ${features.length} features.`);

  console.log('→ Seeding developers...');
  const developers = await seedDevelopers(prisma);
  console.log(`  Created ${developers.length} developer profiles.`);

  console.log('→ Seeding properties...');
  const properties = await seedProperties(prisma, developers, locations, features);
  console.log(`  Created ${properties.length} properties.`);

  console.log('\n Seed complete.');
}

main()
  .catch((err) => {
    console.error(' Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
