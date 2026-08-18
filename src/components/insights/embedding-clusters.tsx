import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, ZAxis } from 'recharts';

const data = [
  { x: 10, y: 20, z: 1, cluster: 'A' },
  { x: 15, y: 25, z: 2, cluster: 'A' },
  { x: 50, y: 60, z: 1, cluster: 'B' },
  { x: 55, y: 65, z: 2, cluster: 'B' },
  { x: 80, y: 10, z: 1, cluster: 'C' },
];

export function EmbeddingClusters() {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <XAxis type="number" dataKey="x" hide />
          <YAxis type="number" dataKey="y" hide />
          <ZAxis type="number" dataKey="z" range={[50, 100]} />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Scatter name="Cluster A" data={data.filter(d => d.cluster === 'A')} fill="hsl(var(--primary))" />
          <Scatter name="Cluster B" data={data.filter(d => d.cluster === 'B')} fill="hsl(var(--accent))" />
          <Scatter name="Cluster C" data={data.filter(d => d.cluster === 'C')} fill="hsl(var(--destructive))" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
