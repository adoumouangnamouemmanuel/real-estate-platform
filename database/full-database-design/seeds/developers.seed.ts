/**
 * database/seeds/developers.seed.ts
 *
 * Seeds 3 sample PropertyDevelopers. Two verified, one pending, so the
 * admin verification workflow (is_verified) has both states to test
 * against on a fresh checkout.
 *
 * Per README §2.2, whatsapp_number, phone_number, profile_image_url,
 * profile_image_public_id, and city are all mandatory — every developer
 * defined here includes all five, on purpose, to model the real
 * constraint correctly (a seed without them would not reflect the rule).
 */

import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const DEV_PASSWORD = 'DevPassword123!'; // dev/staging only

export interface SeededDeveloper {
  developerId: string;
  businessName: string | null;
  city: string;
}

export async function seedDevelopers(prisma: PrismaClient): Promise<SeededDeveloper[]> {
  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 12);

  const definitions = [
    {
      email: 'amadou.traore@lumavok.bf',
      businessName: 'Traoré Immobilier',
      whatsappNumber: '22670123456',
      phoneNumber: '22625123456',
      profileImageUrl: 'https://res.cloudinary.com/lumavok-demo/image/upload/v1/dev_traore.jpg',
      profileImagePublicId: 'lumavok-demo/dev_traore',
      bio: 'Agence immobilière basée à Ouagadougou, spécialisée dans la vente de maisons familiales.',
      yearsOfExperience: 8,
      specialization: 'Maisons familiales',
      languagesSpoken: 'Français, Moore',
      city: 'Ouagadougou',
      isVerified: true,
      verifiedSince: new Date('2026-02-01'),
    },
    {
      email: 'fatou.kone@lumavok.bf',
      businessName: 'Koné & Fils Terrains',
      whatsappNumber: '22670987654',
      phoneNumber: '22625987654',
      profileImageUrl: 'https://res.cloudinary.com/lumavok-demo/image/upload/v1/dev_kone.jpg',
      profileImagePublicId: 'lumavok-demo/dev_kone',
      bio: 'Spécialiste de la vente de terrains résidentiels et commerciaux à Bobo-Dioulasso.',
      yearsOfExperience: 12,
      specialization: 'Terrains',
      languagesSpoken: 'Français, Dioula',
      city: 'Bobo-Dioulasso',
      isVerified: true,
      verifiedSince: new Date('2026-03-15'),
    },
    {
      email: 'ibrahim.sawadogo@lumavok.bf',
      businessName: null, // independent agent, no registered business name yet
      whatsappNumber: '22670555444',
      phoneNumber: '22625555444',
      profileImageUrl: 'https://res.cloudinary.com/lumavok-demo/image/upload/v1/dev_sawadogo.jpg',
      profileImagePublicId: 'lumavok-demo/dev_sawadogo',
      bio: null,
      yearsOfExperience: 1,
      specialization: 'Appartements en location',
      languagesSpoken: 'Français',
      city: 'Ouagadougou',
      isVerified: false, // pending admin review
      verifiedSince: null,
    },
  ];

  const results: SeededDeveloper[] = [];

  for (const def of definitions) {
    const user = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        email: def.email,
        passwordHash,
        role: Role.PROPERTY_DEVELOPER,
      },
    });

    const profile = await prisma.propertyDeveloper.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        businessName: def.businessName,
        whatsappNumber: def.whatsappNumber,
        phoneNumber: def.phoneNumber,
        profileImageUrl: def.profileImageUrl,
        profileImagePublicId: def.profileImagePublicId,
        bio: def.bio,
        yearsOfExperience: def.yearsOfExperience,
        specialization: def.specialization,
        languagesSpoken: def.languagesSpoken,
        city: def.city,
        isVerified: def.isVerified,
        verifiedSince: def.verifiedSince,
      },
    });

    results.push({ developerId: profile.id, businessName: profile.businessName, city: profile.city });
  }

  return results;
}
