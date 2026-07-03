import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export interface AttendancePoint {
  date: string;
  count: number;
}

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
