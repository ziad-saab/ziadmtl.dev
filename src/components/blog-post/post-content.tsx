interface PostContentProps {
  content: string;
}

export const PostContent = ({ content }: PostContentProps) => (
  <div
    className="leading-relaxed prose dark:prose-invert md:prose-xl prose-pre:leading-tight prose-pre:p-0 prose-pre:md:p-0 prose-code:rounded-xl max-w-none"
    dangerouslySetInnerHTML={{ __html: content }}
  />
);