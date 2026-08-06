import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { listDocs, readDoc } from '@/lib/docs';

export const dynamicParams = false;

export function generateStaticParams() {
  return listDocs().map((doc) => ({ slug: doc.slug }));
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = readDoc(slug);
  if (!doc) {
    notFound();
  }
  return (
    <article className="markdown">
      <h1>{doc.title}</h1>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{doc.content}</ReactMarkdown>
    </article>
  );
}
