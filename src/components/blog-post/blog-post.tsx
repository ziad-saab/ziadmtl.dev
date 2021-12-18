import Image from 'next/image';
import { useEffect } from 'react';
import { PostData } from '~/lib/api';
import { PostContent } from './post-content';
import highlight from 'highlight.js';

interface BlogPostProps {
  post: PostData;
}

export const BlogPost = ({ post }: BlogPostProps) => {
  useEffect(() => {
    highlight.highlightAll();
  }, []);

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl lg:text-5xl">{post.title}</h1>
      <p className="text-gray-400">{post.date}</p>
      {
      post.cover && <div className="my-6"><Image priority src={post.cover} layout="responsive" width={1000} height={500} objectFit="cover" alt={`Cover image for ${post.title}`} /></div>
    }
      <PostContent content={post.content} />
    </div>
  );
};