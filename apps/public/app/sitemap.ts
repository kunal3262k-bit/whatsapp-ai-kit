import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  return [
    { url: `${baseUrl}/`, priority: 1 },
    { url: `${baseUrl}/offer`, priority: 0.8 },
    { url: `${baseUrl}/demo`, priority: 0.6 },
  ];
}
