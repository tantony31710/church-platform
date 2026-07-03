import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { t: 1, trend: 10, seasonal: 2, resid: 0.1 },
  { t: 2, trend: 12, seasonal: -1, resid: -0.2 },
  { t: 3, trend: 15, seasonal: 3, resid: 0.05 },
  { t: 4, trend: 18, seasonal: -2, resid: -0.1 },
];

export function TimeSeriesDecomposition() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <XAxis dataKey="t" hide />
          <YAxis hide />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
          <Legend />
          <Line type="monotone" dataKey="trend" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="seasonal" stroke="hsl(var(--accent))" strokeWidth={1} dot={false} />
          <Line type="monotone" dataKey="resid" stroke="hsl(var(--border))" strokeWidth={1} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
