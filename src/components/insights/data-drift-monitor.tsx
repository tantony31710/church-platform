import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const data = [
  { time: '10:00', drift: 0.01 },
  { time: '11:00', drift: 0.02 },
  { time: '12:00', drift: 0.05 },
  { time: '13:00', drift: 0.12 },
  { time: '14:00', drift: 0.08 },
  { time: '15:00', drift: 0.04 },
];

export function DataDriftMonitor() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
          <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} domain={[0, 0.2]} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
          <Line type="monotone" dataKey="drift" stroke="hsl(var(--destructive))" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
