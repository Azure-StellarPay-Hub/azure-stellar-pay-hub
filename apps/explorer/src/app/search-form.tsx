'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@stellar-pay/ui';

export function SearchForm() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = query.trim();
    if (!value) {
      return;
    }
    if (value.length === 36 || value.length === 56) {
      router.push(`/account/${value}`);
    } else {
      router.push(`/tx/${value}`);
    }
  };

  return (
    <form onSubmit={submit} className="relative w-full max-w-sm">
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search tx hash or account…"
        className="pl-9 font-mono text-xs"
      />
    </form>
  );
}
