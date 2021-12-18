interface PostContentProps {
  content: string;
}

export const PostContent = ({ content }: PostContentProps) => (
  <div
    className="text-lg leading-relaxed prose prose-pre:leading-tight prose-pre:p-0 prose-code:rounded-xl max-w-none"
    dangerouslySetInnerHTML={{ __html: content }}
  />
);