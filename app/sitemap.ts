import type { MetadataRoute } from 'next';
import { PROFILE_TYPES } from '@/lib/air_quiz_data';

const BASE_URL = 'https://air.democra.ai';
const LANGS = ['en', 'zh', 'ja', 'ko', 'de'] as const;

function langAlternates(path: string) {
  return Object.fromEntries(
    LANGS.map((l) => [l, `${BASE_URL}${path}?lang=${l}`]),
  );
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const profileCodes = Object.keys(PROFILE_TYPES);

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
      alternates: { languages: langAlternates('/') },
    },
    {
      url: `${BASE_URL}/analysis`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
      alternates: { languages: langAlternates('/analysis') },
    },
    {
      url: `${BASE_URL}/data-protection`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  const profilePages: MetadataRoute.Sitemap = profileCodes.map((code) => ({
    url: `${BASE_URL}/profile/${code}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.9,
    alternates: { languages: langAlternates(`/profile/${code}`) },
  }));

  return [...staticPages, ...profilePages];
}
