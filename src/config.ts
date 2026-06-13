import configJson from '@/config.json'

const siteUrl = import.meta.env.SITE_URL || configJson.site.url

export const config = {
  ...configJson,
  site: {
    ...configJson.site,
    url: siteUrl,
  },
}

export const { site, author } = config

export default config
