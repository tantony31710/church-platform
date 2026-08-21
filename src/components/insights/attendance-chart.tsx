import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';

export interface AttendancePoint {
  date: string;
  count: number;
  label?: string;
}

interface AttendanceChartProps {
  data?: AttendancePoint[];
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  // Default mock dataset if data is empty
  const chartData =
    data && data.length > 0
      ? data
      : [
          { date: 'Week 1', count: 18, label: 'May 5' },
          { date: 'Week 2', count: 24, label: 'May 12' },
          { date: 'Week 3', count: 21, label: 'May 19' },
          { date: 'Week 4', count: 29, label: 'May 26' },
          { date: 'Week 5', count: 27, label: 'Jun 2' },
          { date: 'Week 6', count: 34, label: 'Jun 9' },
          { date: 'Week 7', count: 38, label: 'Jun 16' },
          { date: 'Week 8', count: 42, label: 'Jun 23' },
        ];

  return (
    <div className="h-72 w-full pt-2">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="attendanceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(var(--glow))" stopOpacity={0.4} />
              <stop offset="95%" stopColor="hsl(var(--glow))" stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'hsl(var(--foreground))', opacity: 0.6 }}
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
            formatter={(value: any) => [`${value} Volunteers`, 'Checked In']}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke="hsl(var(--glow))"
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#attendanceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
