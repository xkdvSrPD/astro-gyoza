import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import configJson from './src/config.json'

const siteUrl = process.env.SITE_URL || configJson.site.url

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  integrations: [sitemap()],
  output: 'static',
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
    },
  },
})
