import { generateOgImage } from './generateOgImage.js'
import type { CollectionEntry } from 'astro:content'

/**
 * Generate OG image for a blog post
 */
export async function generatePostOgImage(post: CollectionEntry<'posts'>) {
  // If post has custom cover, use it instead
  if (post.data.cover) {
    return post.data.cover
  }

  const ogPath = await generateOgImage(`posts-${post.slug}`, {
    title: post.data.title,
    description: post.data.summary,
    type: 'post',
    category: post.data.category,
    date: post.data.createAt,
  })

  return ogPath
}

/**
 * Generate OG image for a spec page
 */
export async function generateSpecOgImage(spec: CollectionEntry<'spec'>) {
  const ogPath = await generateOgImage(`spec-${spec.slug}`, {
    title: spec.data.title,
    description: spec.data.description,
    type: 'page',
  })

  return ogPath
}

/**
 * Generate OG image for a generic page
 */
export async function generatePageOgImage(slug: string, title: string, description?: string) {
  const ogPath = await generateOgImage(slug, {
    title,
    description,
    type: 'page',
  })

  return ogPath
}
