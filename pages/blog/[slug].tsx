import { GetStaticPaths, GetStaticProps } from 'next';
import Head from 'next/head';
import { ParsedUrlQuery } from 'querystring';
import { BlogPost } from '~/components/blog-post';
import { Layout } from '~/components/layout';
import { getAllPosts, getPostBySlug, PostData } from '~/lib/api';
import { markdownToHtml } from '~/lib/markdown';

interface BlogPostPageProps {
  post: PostData;
}
interface BlogPostPageParams extends ParsedUrlQuery {
  slug: string;
}

export default function BlogPostPage({ post }: BlogPostPageProps) {
  return (
    <Layout meta={post}>
      <Head>
        {post.title && (
          <>
            <title>{post.title} - Ziad Saab</title>
            <meta key="og_title" property="og:title" content={post.title} />
          </>
        )}
      </Head>
      <BlogPost post={post} />
    </Layout>
  );
}

export const getStaticProps: GetStaticProps<BlogPostPageProps, BlogPostPageParams> = async ({ params }) => {
  if (params?.slug) {
    try {
      const post = getPostBySlug(params.slug);
      const content = await markdownToHtml(post.content || '', post.slug);

      return {
        props: {
          post: {
            ...post,
            content,
          },
        },
      };
    } catch (e) {
      console.error(`Error while getting post by slug: ${params.slug}`, e);
    }
  }

  return {
    notFound: true,
  };
};

export const getStaticPaths: GetStaticPaths = async () => {
  const posts = getAllPosts();

  return {
    paths: posts.map((post) => {
      return {
        params: {
          slug: post.slug,
        },
      };
    }),
    fallback: 'blocking',
  };
};