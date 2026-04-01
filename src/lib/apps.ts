import { prisma } from "./prisma";

export async function getAllApps() {
  return prisma.app.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function getAppBySlug(slug: string) {
  return prisma.app.findUnique({
    where: { slug },
  });
}

export async function getFeaturedApps() {
  return prisma.app.findMany({
    where: { featured: true },
    orderBy: { createdAt: "desc" },
  });
}

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}
