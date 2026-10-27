import { prisma } from '../../lib/prisma.js';

export async function listCategories() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ nameEn: 'asc' }],
  });
}

export async function listCities() {
  return prisma.city.findMany({ orderBy: { nameEn: 'asc' } });
}

export async function listTownships(cityId?: string) {
  if (cityId) {
    return prisma.township.findMany({
      where: { cityId },
      orderBy: { nameEn: 'asc' },
      include: { city: true },
    });
  }
  return prisma.township.findMany({
    orderBy: { nameEn: 'asc' },
    include: { city: true },
  });
}
