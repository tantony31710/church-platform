'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface AttendancePoint {
  date: string;
  count: number;
}

// Admin-only chart, rendered inside app/(dashboard)/insights/page.tsx.
// Expects pre-aggregated data (one point per day/session) — do NOT
// pass raw attendance documents here; aggregate them server-side
// first (see firestore_data_utils.py's pandas groupby pattern, or a
// Cloud Function that maintains a daily rollup doc) so this chart
// doesn't need to process thousands of records in the browser.
export function AttendanceChart({ data }: { data: AttendancePoint[] }) {
  return (
    <div className="h-72 w-full rounded-lg border border-border bg-white/60 backdrop-blur-glass p-4">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="date" fontSize={12} />
          <YAxis fontSize={12} />
          <Tooltip />
          <Line type="monotone" dataKey="count" stroke="#7F77DD" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
