import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      { userAgent: '*', disallow: ['/api/', '/history', '/settings', '/auth/'] },
    ],
    sitemap: 'https://deepclario.com/sitemap.xml',
  }
}
