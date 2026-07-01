'use client';

import { useAuth } from '@/lib/auth-context';
import { QrGenerator } from '@/components/attendance/qr-generator';

// A single hardcoded eventId for now — in practice this would come
// from a session picker (today's Sunday school session, etc.). Kept
// simple here since attendance session management is a separate
// feature from the QR mechanism itself.
const TODAYS_EVENT_ID = 'sunday-service-current';

export default function AttendancePage() {
  const { role } = useAuth();

  if (role !== 'admin') {
    return <p className="text-sm text-neutral-500">Only leaders can generate attendance codes.</p>;
  }

  return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-4">
      <h1 className="text-xl font-medium">Attendance check-in</h1>
      <QrGenerator eventId={TODAYS_EVENT_ID} />
    </div>
  );
}
