'use client';

import { useAuth } from '@/lib/auth-context';
import { AttendanceChart } from '@/components/insights/attendance-chart';

// Placeholder aggregated data — replace with a fetch from a rollup
// collection (e.g. 'dailyAttendanceStats') maintained by a Cloud
// Function, or from an API route that runs the pandas aggregation in
// firestore_data_utils.py server-side and returns JSON.
const placeholderData = [
  { date: 'Jun 1', count: 18 },
  { date: 'Jun 8', count: 22 },
  { date: 'Jun 15', count: 19 },
  { date: 'Jun 22', count: 27 },
  { date: 'Jun 29', count: 25 },
];

export default function InsightsPage() {
  const { role } = useAuth();

  if (role !== 'admin') {
    return <p className="text-sm text-foreground/50">This tab is only available to church leaders.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-xl font-medium text-foreground">Insights</h1>
      <AttendanceChart data={placeholderData} />
    </div>
  );
}
