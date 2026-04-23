import { author, site } from '@/config.json'
import { getFormattedDateTime } from '@/utils/date'
import { emitToast } from '@/utils/toast'

function getPostUrl(slug: string) {
  return new URL(slug, site.url).href
}

export function PostCopyright({
  title,
  slug,
  lastMod,
}: {
  title: string
  slug: string
  lastMod: Date
}) {
  const lastModStr = getFormattedDateTime(lastMod)
  const url = getPostUrl(slug)

  async function handleCopyUrl() {
    try {
      await navigator.clipboard.writeText(url)
      emitToast('Link copied')
    } catch {
      emitToast('Copy failed', 'error')
    }
  }

  return (
    <section className="text-xs leading-loose text-secondary">
      <p>Title: {title}</p>
      <p>Author: {author.name}</p>
      <p>
        <span>Link: {url}</span>{' '}
        <button
          type="button"
          className="cursor-pointer select-none hover:text-accent"
          onClick={() => void handleCopyUrl()}
        >
          [Copy]
        </button>
      </p>
      <p>Last updated: {lastModStr}</p>
      <hr className="my-3 border-primary" />
      <p>
        Commercial reuse requires permission from the site owner. For non-commercial reuse, keep the
        source and article link. Derivatives should stay under the same license.
        <br />
        This article is licensed under{' '}
        <a
          className="underline-offset-2 hover:text-accent hover:underline"
          href="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh"
          target="_blank"
          rel="noopener noreferrer"
        >
          CC BY-NC-SA 4.0
        </a>
        .
      </p>
    </section>
  )
}
