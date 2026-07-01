import { redirect } from 'next/navigation';

// The root route has no content of its own — it just sends visitors
// to the tasks dashboard. If they're not logged in, the (dashboard)
// layout's auth check will bounce them to /login from there. This is
// what was missing: without this file, "/" had no matching route at
// all and Next.js served a 404.
export default function RootPage() {
  redirect('/tasks');
}
