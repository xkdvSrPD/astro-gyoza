type TaxonomyType = 'tag' | 'category'

const tagHues = [60, 120, 30, 240, 0, 180, 300, 210, 90, 330, 150, 270]
const tagSaturations = [100]
const tagLightnesses = [74, 77, 80]
const tagColorCount = tagHues.length * tagSaturations.length * tagLightnesses.length

function hashString(value: string) {
  let hash = 0x811c9dc5

  for (const char of value) {
    hash ^= char.codePointAt(0)!
    hash = Math.imul(hash, 0x01000193) >>> 0
  }

  return hash
}

export function taxonomyHref(type: TaxonomyType, value: string) {
  return `/${type}/${encodeURIComponent(value)}`
}

export function getTagStyle(tag: string) {
  let slot = hashString(tag) % tagColorCount
  const hue = tagHues[slot % tagHues.length]
  slot = Math.floor(slot / tagHues.length)
  const saturation = tagSaturations[slot % tagSaturations.length]
  slot = Math.floor(slot / tagSaturations.length)
  const lightness = tagLightnesses[slot % tagLightnesses.length]
  const borderSaturation = saturation
  const borderLightness = Math.max(lightness - 54, 22)

  return `--tag-bg: hsl(${hue} ${saturation}% ${lightness}%); --tag-border: hsl(${hue} ${borderSaturation}% ${borderLightness}%);`
}
