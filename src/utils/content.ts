import { getCollection, type CollectionEntry } from 'astro:content'

type PostEntry = CollectionEntry<'posts'>

interface CountedItem {
  slug: string
  name: string
  count: number
}

interface PostMetrics {
  words: number
  readingMinutes: number
}

interface ContentStats {
  categories: CountedItem[]
  tags: CountedItem[]
  totalWordCount: number
  metricsById: Map<string, PostMetrics>
}

let allPostsPromise: Promise<PostEntry[]> | undefined
let oldestPostsPromise: Promise<PostEntry[]> | undefined
let sortedPostsPromise: Promise<PostEntry[]> | undefined
let contentStatsPromise: Promise<ContentStats> | undefined

function clonePosts(posts: PostEntry[]) {
  return [...posts]
}

function cloneCountedItems(items: CountedItem[]) {
  return items.map((item) => ({ ...item }))
}

async function loadAllPosts() {
  if (!allPostsPromise) {
    allPostsPromise = getCollection('posts', ({ data }) => {
      return import.meta.env.PROD ? data.draft !== true : true
    })
  }

  return allPostsPromise
}

function sortByCreateAtAsc(posts: PostEntry[]) {
  return clonePosts(posts).sort((a, b) => a.data.createAt.valueOf() - b.data.createAt.valueOf())
}

function sortByCreateAtDesc(posts: PostEntry[]) {
  return clonePosts(posts).sort((a, b) => b.data.createAt.valueOf() - a.data.createAt.valueOf())
}

function sortByStickyAndCreateAtDesc(posts: PostEntry[]) {
  return clonePosts(posts).sort((a, b) => {
    if (a.data.sticky !== b.data.sticky) {
      return b.data.sticky - a.data.sticky
    }

    return b.data.createAt.valueOf() - a.data.createAt.valueOf()
  })
}

function increaseCount(items: CountedItem[], indexBySlug: Map<string, number>, name: string) {
  const slug = slugify(name)
  const index = indexBySlug.get(slug)

  if (index === undefined) {
    indexBySlug.set(slug, items.length)
    items.push({
      slug,
      name,
      count: 1,
    })
    return
  }

  items[index].count += 1
}

async function loadContentStats() {
  if (!contentStatsPromise) {
    contentStatsPromise = (async () => {
      const posts = await loadAllPosts()
      const orderedPosts = sortByCreateAtAsc(posts)
      const categories: CountedItem[] = []
      const categoryIndexBySlug = new Map<string, number>()
      const tags: CountedItem[] = []
      const tagIndexBySlug = new Map<string, number>()

      const renderedMetrics = await Promise.all(
        posts.map(async (post) => {
          const { remarkPluginFrontmatter } = await post.render()

          return [
            post.id,
            {
              words: Number(remarkPluginFrontmatter.words) || 0,
              readingMinutes: Number(remarkPluginFrontmatter.readingMinutes) || 0,
            },
          ] as const
        }),
      )

      const metricsById = new Map<string, PostMetrics>()
      let totalWordCount = 0

      for (const [postId, metrics] of renderedMetrics) {
        metricsById.set(postId, metrics)
        totalWordCount += metrics.words
      }

      for (const post of orderedPosts) {
        if (post.data.category) {
          increaseCount(categories, categoryIndexBySlug, post.data.category)
        }

        for (const tag of post.data.tags) {
          increaseCount(tags, tagIndexBySlug, tag)
        }
      }

      return {
        categories,
        tags,
        totalWordCount,
        metricsById,
      }
    })()
  }

  return contentStatsPromise
}

export async function getOldestPosts() {
  if (!oldestPostsPromise) {
    oldestPostsPromise = loadAllPosts().then(sortByCreateAtDesc)
  }

  return clonePosts(await oldestPostsPromise)
}

export async function getSortedPosts() {
  if (!sortedPostsPromise) {
    sortedPostsPromise = loadAllPosts().then(sortByStickyAndCreateAtDesc)
  }

  return clonePosts(await sortedPostsPromise)
}

export async function getAllPostsWordCount() {
  const { totalWordCount } = await loadContentStats()
  return totalWordCount
}

export async function getPostMetrics(post: PostEntry) {
  const { metricsById } = await loadContentStats()

  return (
    metricsById.get(post.id) ?? {
      words: 0,
      readingMinutes: 0,
    }
  )
}

export function slugify(text: string) {
  return text.replace(/\./g, '').replace(/\s/g, '-').toLowerCase()
}

export async function getAllCategories() {
  const { categories } = await loadContentStats()
  return cloneCountedItems(categories)
}

export async function getAllTags() {
  const { tags } = await loadContentStats()
  return cloneCountedItems(tags)
}

export async function getHotTags(len = 5) {
  const allTags = await getAllTags()

  return allTags.sort((a, b) => b.count - a.count).slice(0, len)
}
