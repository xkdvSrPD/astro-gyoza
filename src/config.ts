/**
 * Configuration module with environment variable support
 *
 * Supports overriding site.url via SITE_URL environment variable at build time.
 * This allows deploying the same codebase to multiple domains.
 *
 * Usage:
 *   SITE_URL=https://example.com pnpm build
 */

import configJson from '@/config.json'

// Allow overriding site.url via environment variable
const siteUrl = import.meta.env.SITE_URL || configJson.site.url

export const config = {
  ...configJson,
  site: {
    ...configJson.site,
    url: siteUrl,
  },
}

// Export individual sections for convenience
export const { site, author, hero, color, menus, posts, footer, giscus, sponsor, analytics } =
  config

// Export default for compatibility
export default config
