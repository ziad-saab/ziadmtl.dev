import { Plugin, unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGemoji from 'remark-gemoji';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import { visit } from 'unist-util-visit';
import { Root } from 'rehype-stringify/lib';

const imageTransformer: Plugin<[string], Root> = (slug: string) => (tree) => {
  visit(tree, 'element', (node) => {
    if (node.tagName === 'img' && typeof node?.properties?.src === 'string' && !node.properties.src.startsWith('http')) {
      node.properties.src = `/blog-images/${slug}/${node.properties.src}`;
    }
  });
};

export async function markdownToHtml(markdown: string, slug: string) {
  const result = await (
    unified()
      .use(remarkParse)
      .use(remarkGemoji)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(imageTransformer, slug)
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(markdown)
  );
  return result.toString();
}