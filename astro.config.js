import { defineConfig } from 'astro/config'
import sitemap from '@astrojs/sitemap'
import configJson from './src/config.json'

const siteUrl = process.env.SITE_URL || configJson.site.url
const giscusCorsHeaders = {
  'Access-Control-Allow-Origin': 'https://giscus.app',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': 'Origin, Accept, Content-Type',
  'Cache-Control': 'no-store',
}

// https://astro.build/config
export default defineConfig({
  site: siteUrl,
  integrations: [sitemap()],
  output: 'static',
  build: {
    inlineStylesheets: 'never',
  },
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
    },
  },
  vite: {
    server: {
      headers: giscusCorsHeaders,
    },
    preview: {
      headers: giscusCorsHeaders,
    },
  },
})
