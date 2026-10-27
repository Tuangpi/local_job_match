import { PrismaClient } from '../src/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const CITY_NAME = 'Yangon';
const CITY_NAME_MY = 'ရန်ကုန်';

const TOWNSHIPS = [
  { nameEn: 'Kamayut', nameMy: 'ကမာရွတ်' },
  { nameEn: 'Hlaing', nameMy: 'လှိုင်' },
  { nameEn: 'Sanchaung', nameMy: 'စမ်းချောင်း' },
  { nameEn: 'Bahan', nameMy: 'ဗဟန်း' },
  { nameEn: 'Mayangone', nameMy: 'မရမ်းကုန်း' },
  { nameEn: 'Insein', nameMy: 'အင်းစိန်' },
];

const CATEGORIES = [
  { slug: 'plumbing', nameEn: 'Plumbing', nameMy: 'ပိုက်နှင့်ရေပိုက်' },
  { slug: 'electrical', nameEn: 'Electrical', nameMy: 'လျှပ်စစ်' },
  { slug: 'carpentry', nameEn: 'Carpentry', nameMy: 'သစ်သားလုပ်ငန်း' },
  { slug: 'painting', nameEn: 'Painting', nameMy: 'ဆေးသုတ်' },
  {
    slug: 'solar-installation',
    nameEn: 'Solar installation',
    nameMy: 'နေရောင်ခြည်စွမ်းအင် တပ်ဆင်ခြင်း',
  },
  { slug: 'general-repair', nameEn: 'General repair', nameMy: 'ယေဘုယျပြုပြင်' },
];

async function main(): Promise<void> {
  const city = await prisma.city.upsert({
    where: { nameEn: CITY_NAME },
    update: { nameMy: CITY_NAME_MY },
    create: { nameEn: CITY_NAME, nameMy: CITY_NAME_MY },
  });

  for (const township of TOWNSHIPS) {
    await prisma.township.upsert({
      where: { cityId_nameEn: { cityId: city.id, nameEn: township.nameEn } },
      update: { nameMy: township.nameMy },
      create: { cityId: city.id, nameEn: township.nameEn, nameMy: township.nameMy },
    });
  }

  for (const category of CATEGORIES) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { nameEn: category.nameEn, nameMy: category.nameMy, isActive: true },
      create: {
        slug: category.slug,
        nameEn: category.nameEn,
        nameMy: category.nameMy,
        isActive: true,
      },
    });
  }

  console.log(
    `Seeded city ${CITY_NAME}, ${TOWNSHIPS.length} townships, ${CATEGORIES.length} categories.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
