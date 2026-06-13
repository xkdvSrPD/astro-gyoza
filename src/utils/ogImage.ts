import { generateOgImage } from './generateOgImage'
import type { CollectionEntry } from 'astro:content'

export async function generatePostOgImage(post: CollectionEntry<'posts'>) {
  if (post.data.cover) {
    return post.data.cover
  }
  return await generateOgImage(`posts-${post.slug}`, {
    title: post.data.title,
    description: post.data.summary,
    type: 'post',
    category: post.data.category,
    date: post.data.createAt,
  })
}

export async function generateSpecOgImage(spec: CollectionEntry<'spec'>) {
  return await generateOgImage(`spec-${spec.slug}`, {
    title: spec.data.title,
    description: spec.data.description,
    type: 'page',
  })
}

export async function generatePageOgImage(slug: string, title: string, description?: string) {
  return await generateOgImage(slug, { title, description, type: 'page' })
}
