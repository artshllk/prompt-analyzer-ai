import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/dashboard', '/history', '/insights', '/settings', '/auth/'] },
    ],
    sitemap: 'https://deepclario.com/sitemap.xml',
  }
}
