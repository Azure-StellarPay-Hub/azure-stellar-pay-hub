export function shortKey(key: string, head = 6, tail = 4): string {
  if (!key || key.length <= head + tail + 1) {
    return key;
  }
  return `${key.slice(0, head)}…${key.slice(-tail)}`;
}

export function formatDate(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function formatDateTime(input: string | Date): string {
  const date = typeof input === 'string' ? new Date(input) : input;
  return date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
