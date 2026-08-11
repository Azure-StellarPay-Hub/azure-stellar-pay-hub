'use client';

/**
 * Root-level error boundary rendered when the root layout itself throws.
 * Must define its own <html> and <body> — no layout providers are available.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-errorjs
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-8">
        <div className="text-center max-w-md space-y-6">
          <div className="text-6xl">⚠️</div>
          <h1 className="text-2xl font-bold">Something went wrong</h1>
          <p className="text-gray-400 text-sm">
            {error.message || 'An unexpected error occurred. Please try again.'}
          </p>
          <button
            onClick={() => reset()}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-500 transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
