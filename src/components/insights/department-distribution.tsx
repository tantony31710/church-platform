import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';

const data = [
  { name: 'AV & Tech', volunteers: 4, tasksCompleted: 24, fill: '#38bdf8' },
  { name: 'Hospitality', volunteers: 6, tasksCompleted: 32, fill: '#2dd4bf' },
  { name: 'Youth & Kids', volunteers: 5, tasksCompleted: 28, fill: '#fbbf24' },
  { name: 'Worship Arts', volunteers: 4, tasksCompleted: 20, fill: '#a855f7' },
  { name: 'Facilities', volunteers: 3, tasksCompleted: 18, fill: '#f43f5e' },
  { name: 'Outreach', volunteers: 5, tasksCompleted: 26, fill: '#34d399' },
];

export function DepartmentDistribution() {
  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fontSize: 10, fill: 'hsl(var(--foreground))', opacity: 0.7 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', opacity: 0.6 }}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card-bg))',
              borderColor: 'hsl(var(--border-strong))',
              borderRadius: '0.75rem',
              color: 'hsl(var(--foreground))',
              fontSize: '12px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)',
            }}
            formatter={(value: any, name: string) => [
              value,
              name === 'volunteers' ? 'Active Volunteers' : 'Completed Assignments',
            ]}
          />
          <Bar dataKey="tasksCompleted" name="tasksCompleted" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
