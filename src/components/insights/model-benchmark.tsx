import { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase/client';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Benchmark {
  accuracy: number;
  precision: number;
  recall: number;
  timestamp: any;
}

export function ModelBenchmarkWidget() {
  const [data, setData] = useState<Benchmark[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const q = query(collection(db, 'model_benchmarks'), orderBy('timestamp', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const benchmarks: Benchmark[] = [];
      querySnapshot.forEach((doc) => {
        benchmarks.push(doc.data() as Benchmark);
      });
      setData(benchmarks.reverse());
    };
    fetchData();
  }, []);

  return (
    <div className="h-72 w-full rounded-lg border border-border bg-white/60 backdrop-blur-glass p-4">
      <h3 className="text-lg font-semibold mb-2">Model Benchmarks (Last 10)</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
          <XAxis dataKey="timestamp" hide />
          <YAxis domain={[0.7, 1]} />
          <Tooltip />
          <Line type="monotone" dataKey="accuracy" stroke="#8884d8" name="Accuracy" />
          <Line type="monotone" dataKey="precision" stroke="#82ca9d" name="Precision" />
          <Line type="monotone" dataKey="recall" stroke="#ffc658" name="Recall" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
