/**
 * database/seeds/properties.seed.ts
 *
 * Seeds 8 sample properties across all 4 PropertyCategory values
 * (APARTMENT, HOUSE, LAND, COMMERCIAL) and both ListingTypes, distributed
 * across the 3 seeded developers, each linked to a real City and (mostly)
 * a real District, with sample features and at least one primary photo —
 * matching the README's rule that an ACTIVE listing should have a primary
 * image (§2.8).
 */

import { PrismaClient, ListingType, PropertyCategory, PropertyStatus } from '@prisma/client';
import type { SeededDeveloper } from './developers.seed';
import type { SeededLocations } from './locations.seed';
import type { SeededFeature } from './features.seed';

interface PropertyDefinition {
  developerIndex: number;
  title: string;
  slug: string;
  description: string;
  category: PropertyCategory;
  listingType: ListingType;
  price: number;
  address: string;
  cityName: string;
  districtName?: string; // optional, matches README (district_id is nullable)
  bedrooms?: number;
  bathrooms?: number;
  carSpaces?: number;
  landSizeSqM?: number;
  buildingSizeSqM?: number;
  yearBuilt?: number;
  status?: PropertyStatus;
  featureNames?: string[];
}

const PROPERTY_DEFINITIONS: PropertyDefinition[] = [
  {
    developerIndex: 0,
    title: 'Belle Maison 3 Chambres à Zone du Bois',
    slug: 'belle-maison-3-chambres-zone-du-bois',
    description:
      'Maison familiale moderne avec jardin, garage et panneaux solaires. Idéale pour une famille.',
    category: PropertyCategory.HOUSE,
    listingType: ListingType.SALE,
    price: 28000000,
    address: 'Rue 12.34, Zone du Bois',
    cityName: 'Ouagadougou',
    districtName: 'Zone du Bois',
    bedrooms: 3,
    bathrooms: 2,
    carSpaces: 1,
    landSizeSqM: 500,
    buildingSizeSqM: 180,
    yearBuilt: 2020,
    featureNames: ['Garage', 'Solar Panel', 'Garden', 'Security Wall'],
  },
  {
    developerIndex: 0,
    title: 'Appartement Meublé 2 Chambres à Gounghin',
    slug: 'appartement-meuble-2-chambres-gounghin',
    description: 'Appartement entièrement meublé avec climatisation, proche du centre-ville.',
    category: PropertyCategory.APARTMENT,
    listingType: ListingType.RENT,
    price: 150000,
    address: 'Avenue Kwame Nkrumah, Gounghin',
    cityName: 'Ouagadougou',
    districtName: 'Gounghin',
    bedrooms: 2,
    bathrooms: 1,
    buildingSizeSqM: 75,
    yearBuilt: 2018,
    featureNames: ['Furnished', 'Air Conditioning'],
  },
  {
    developerIndex: 0,
    title: 'Terrain Résidentiel à Ouaga 2000',
    slug: 'terrain-residentiel-ouaga-2000',
    description: 'Terrain viabilisé avec titre foncier, prêt pour construction.',
    category: PropertyCategory.LAND,
    listingType: ListingType.SALE,
    price: 35000000,
    address: 'Secteur 50, Ouaga 2000',
    cityName: 'Ouagadougou',
    districtName: 'Ouaga 2000',
    landSizeSqM: 600,
  },
  {
    developerIndex: 1,
    title: 'Terrain Commercial à Accart-Ville',
    slug: 'terrain-commercial-accart-ville',
    description: 'Grand terrain en bordure de route principale, idéal pour commerce ou entrepôt.',
    category: PropertyCategory.LAND,
    listingType: ListingType.SALE,
    price: 42000000,
    address: 'Route de Banfora, Accart-Ville',
    cityName: 'Bobo-Dioulasso',
    districtName: 'Accart-Ville',
    landSizeSqM: 1200,
  },
  {
    developerIndex: 1,
    title: 'Maison 4 Chambres à Dafra',
    slug: 'maison-4-chambres-dafra',
    description: 'Grande maison avec forage et générateur, quartier calme et sécurisé.',
    category: PropertyCategory.HOUSE,
    listingType: ListingType.SALE,
    price: 32000000,
    address: 'Secteur 7, Dafra',
    cityName: 'Bobo-Dioulasso',
    districtName: 'Dafra',
    bedrooms: 4,
    bathrooms: 3,
    carSpaces: 2,
    landSizeSqM: 700,
    buildingSizeSqM: 220,
    yearBuilt: 2019,
    featureNames: ['Borehole / Forage', 'Generator', 'Gated Compound'],
  },
  {
    developerIndex: 1,
    title: 'Local Commercial à Sikasso-Cira',
    slug: 'local-commercial-sikasso-cira',
    description: 'Local commercial sur rue passante, idéal pour boutique ou bureau.',
    category: PropertyCategory.COMMERCIAL,
    listingType: ListingType.RENT,
    price: 120000,
    address: 'Avenue de la Liberté, Sikasso-Cira',
    cityName: 'Bobo-Dioulasso',
    districtName: 'Sikasso-Cira',
    buildingSizeSqM: 60,
  },
  {
    developerIndex: 2,
    title: 'Studio Meublé à Koulouba (En Préparation)',
    slug: 'studio-meuble-koulouba',
    description: 'Petit studio meublé, proche des bâtiments administratifs. Photos en cours d\'ajout.',
    category: PropertyCategory.APARTMENT,
    listingType: ListingType.RENT,
    price: 85000,
    address: 'Rue de Koulouba',
    cityName: 'Ouagadougou',
    districtName: 'Koulouba',
    bedrooms: 1,
    bathrooms: 1,
    buildingSizeSqM: 35,
    status: PropertyStatus.DRAFT, // exercises the non-default status path; no district required to test nullable case below
  },
  {
    developerIndex: 2,
    title: 'Petite Maison à Ouagadougou (Sans Quartier Précis)',
    slug: 'petite-maison-ouagadougou-sans-quartier',
    description: 'Maison simple, localisation précise à confirmer avec le vendeur.',
    category: PropertyCategory.HOUSE,
    listingType: ListingType.RENT,
    price: 60000,
    address: 'À préciser',
    cityName: 'Ouagadougou',
    // districtName intentionally omitted — exercises the nullable district_id
    bedrooms: 2,
    bathrooms: 1,
  },
];

export async function seedProperties(
  prisma: PrismaClient,
  developers: SeededDeveloper[],
  locations: SeededLocations,
  features: SeededFeature[]
) {
  const created = [];

  for (const def of PROPERTY_DEFINITIONS) {
    const developer = developers[def.developerIndex];
    if (!developer) {
      throw new Error(`Seed config error: developerIndex ${def.developerIndex} out of range for "${def.title}"`);
    }

    const city = locations.cities.find((c) => c.name === def.cityName);
    if (!city) {
      throw new Error(`Seed config error: city "${def.cityName}" not found for "${def.title}"`);
    }

    const district = def.districtName
      ? locations.districts.find((d) => d.cityId === city.id && d.name === def.districtName)
      : null;

    const status = def.status ?? PropertyStatus.ACTIVE;

    const property = await prisma.property.upsert({
      where: { slug: def.slug },
      update: {},
      create: {
        propertyDeveloperId: developer.developerId,
        title: def.title,
        slug: def.slug,
        description: def.description,
        category: def.category,
        listingType: def.listingType,
        price: def.price,
        address: def.address,
        cityId: city.id,
        districtId: district?.id ?? null,
        bedrooms: def.bedrooms,
        bathrooms: def.bathrooms,
        carSpaces: def.carSpaces,
        landSizeSqM: def.landSizeSqM,
        buildingSizeSqM: def.buildingSizeSqM,
        yearBuilt: def.yearBuilt,
        status,
        publishedAt: status === PropertyStatus.ACTIVE ? new Date() : null,
      },
    });

    // Attach features (skip if already attached, since upsert above is a no-op on re-run)
    if (def.featureNames?.length) {
      for (const featureName of def.featureNames) {
        const feature = features.find((f) => f.featureName === featureName);
        if (!feature) continue;
        await prisma.propertyFeature.upsert({
          where: { propertyId_featureId: { propertyId: property.id, featureId: feature.id } },
          update: {},
          create: { propertyId: property.id, featureId: feature.id },
        });
      }
    }

    // Every property gets at least one primary photo, per README §2.8's
    // rule that ACTIVE listings should have a primary image.
    const existingMedia = await prisma.propertyMedia.findFirst({
      where: { propertyId: property.id, isPrimary: true },
    });
    if (!existingMedia) {
      await prisma.propertyMedia.create({
        data: {
          propertyId: property.id,
          url: `https://res.cloudinary.com/lumavok-demo/image/upload/v1/${def.slug}-1.jpg`,
          publicId: `lumavok-demo/${def.slug}-1`,
          isPrimary: true,
          order: 0,
          altText: def.title,
        },
      });
    }

    created.push(property);
  }

  return created;
}
