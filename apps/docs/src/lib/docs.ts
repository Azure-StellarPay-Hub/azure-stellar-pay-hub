import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export const DOC_FILES = [
  'architecture',
  'api',
  'sdk',
  'contracts',
  'database',
  'deployment',
  'development',
  'contributing',
] as const;

export type DocSlug = (typeof DOC_FILES)[number];

export interface DocMeta {
  slug: DocSlug;
  title: string;
  description?: string;
}

export interface Doc {
  slug: DocSlug;
  title: string;
  description?: string;
  content: string;
}

function docsDir(): string {
  return path.join(process.cwd(), '..', '..', 'docs');
}

export function listDocs(): DocMeta[] {
  return DOC_FILES.map((slug) => {
    const raw = fs.readFileSync(path.join(docsDir(), `${slug}.md`), 'utf8');
    const { data } = matter(raw);
    return {
      slug,
      title: (data.title as string) ?? slug,
      description: (data.description as string | undefined) ?? undefined,
    };
  });
}

export function readDoc(slug: string): Doc | null {
  if (!DOC_FILES.includes(slug as DocSlug)) {
    return null;
  }
  const raw = fs.readFileSync(path.join(docsDir(), `${slug}.md`), 'utf8');
  const { data, content } = matter(raw);
  return {
    slug: slug as DocSlug,
    title: (data.title as string) ?? slug,
    description: data.description as string | undefined,
    content,
  };
}
