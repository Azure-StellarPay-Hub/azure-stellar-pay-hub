export function shortKey(key: string | null | undefined, head = 8, tail = 6): string {
  if (!key || key.length <= head + tail + 1) {
    return key ?? '—';
  }
  return `${key.slice(0, head)}…${key.slice(-tail)}`;
}

export function formatDateTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
