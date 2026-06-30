/**
 * database/seeds/features.seed.ts
 *
 * Seeds the Feature (amenities) master list. Per README §2.6, features are
 * added by Admins, not by sellers, to keep the dropdown list clean and
 * prevent spelling mistakes (e.g., "Swiming Pool" vs "Swimming Pool").
 */

import { PrismaClient } from '@prisma/client';

export interface SeededFeature {
  id: string;
  featureName: string;
}

const FEATURE_DEFINITIONS = [
  { featureName: 'Swimming Pool', category: 'Outdoor', iconName: 'pool' },
  { featureName: 'Garage', category: 'Outdoor', iconName: 'garage' },
  { featureName: 'Solar Panel', category: 'Energy', iconName: 'solar-panel' },
  { featureName: 'Borehole / Forage', category: 'Utilities', iconName: 'water-pump' },
  { featureName: 'Generator', category: 'Utilities', iconName: 'generator' },
  { featureName: 'Security Wall', category: 'Security', iconName: 'wall' },
  { featureName: 'Gated Compound', category: 'Security', iconName: 'gate' },
  { featureName: 'Air Conditioning', category: 'Appliances', iconName: 'ac-unit' },
  { featureName: 'Furnished', category: 'Appliances', iconName: 'sofa' },
  { featureName: 'Garden', category: 'Outdoor', iconName: 'tree' },
];

export async function seedFeatures(prisma: PrismaClient): Promise<SeededFeature[]> {
  const created: SeededFeature[] = [];

  for (const def of FEATURE_DEFINITIONS) {
    const feature = await prisma.feature.upsert({
      where: { featureName: def.featureName },
      update: {},
      create: def,
    });
    created.push({ id: feature.id, featureName: feature.featureName });
  }

  return created;
}
