import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const data = [
  { name: 'Task Completion', value: 0.85 },
  { name: 'Volunteer Hours', value: 0.72 },
  { name: 'Attendance Rate', value: 0.65 },
  { name: 'Skill Matching', value: 0.45 },
  { name: 'Community Engagement', value: 0.35 },
];

export function FeatureImportance() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
          <XAxis type="number" domain={[0, 1]} hide />
          <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 10, fill: 'hsl(var(--foreground))' }} />
          <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
          <Bar dataKey="value" fill="hsl(var(--primary))">
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? 'hsl(var(--primary))' : 'hsl(var(--accent))'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
