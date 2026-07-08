import { useAuth } from '@/lib/auth-context';
import { QrGenerator } from '@/modules/attendance/qr-generator';

const TODAYS_EVENT_ID = 'sunday-service-current';

export default function AttendancePage() {
  const { role } = useAuth();

  if (role !== 'admin') {
    return <p className="text-sm text-foreground/50">Only leaders can generate attendance codes.</p>;
  }

  return (
    <div className="max-w-md mx-auto flex flex-col items-center gap-4">
      <h1 className="text-xl font-medium text-foreground">Attendance check-in</h1>
      <QrGenerator eventId={TODAYS_EVENT_ID} />
    </div>
  );
}
