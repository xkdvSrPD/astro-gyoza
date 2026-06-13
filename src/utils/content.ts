import { getCollection, type CollectionEntry } from 'astro:content'

type PostEntry = CollectionEntry<'posts'>

let allPostsPromise: Promise<PostEntry[]> | undefined

async function loadAllPosts() {
  if (!allPostsPromise) {
    allPostsPromise = getCollection('posts', ({ data }) => {
      return import.meta.env.PROD ? data.draft !== true : true
    })
  }
  return allPostsPromise
}

export async function getSortedPosts() {
  const posts = await loadAllPosts()
  return [...posts].sort((a, b) => {
    if (a.data.sticky !== b.data.sticky) {
      return b.data.sticky - a.data.sticky
    }
    return b.data.createAt.valueOf() - a.data.createAt.valueOf()
  })
}

export async function getOldestPosts() {
  const posts = await loadAllPosts()
  return [...posts].sort((a, b) => b.data.createAt.valueOf() - a.data.createAt.valueOf())
}
