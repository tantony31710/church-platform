'use client';

// Isolates the ssr:false dynamic import in its own Client Component.
// next/dynamic with ssr:false is only allowed inside a Client
// Component boundary — using it directly in a Server Component (a
// page.tsx with no 'use client') fails the build. Keeping this in a
// separate file means app/(dashboard)/tasks/page.tsx can stay a plain
// Server Component instead of needing 'use client' itself.

import dynamic from 'next/dynamic';

const InteractionHub = dynamic(
  () => import('./interaction-hub').then((m) => m.InteractionHub),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 rounded-lg glass animate-pulse-glow flex items-center justify-center">
        <span className="text-xs text-foreground/40">Loading community view...</span>
      </div>
    ),
  }
);

export default InteractionHub;
