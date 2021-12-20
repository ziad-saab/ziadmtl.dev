import fs from 'fs';
import { join } from 'path';
import matter from 'gray-matter';

export interface PostData {
  slug: string;
  content: string;
  title: string;
  description: string;
  cover: string;
  date: string;
  draft?: boolean;
}

const postsDirectory = join(process.cwd(), '_posts');

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string): PostData {
  const realSlug = slug.replace(/\.md$/, '');
  const fullPath = join(postsDirectory, `${realSlug}.md`);

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  const postData = {
    content,
    slug: realSlug,
    ...data,
  } as PostData;

  return postData;
}

export function getAllPosts() {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug))
    .filter((post) => !post.draft)
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
