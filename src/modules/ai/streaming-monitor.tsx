import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

export const StreamingMonitor: React.FC = () => {
  const [data, setData] = useState<{ time: number; value: number }[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      setData((prev) => {
        const newData = [...prev, { time: prev.length, value: Math.random() * 100 }];
        return newData.slice(-20);
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="p-4">
      <h3 className="font-medium text-lg mb-4">Streaming Data Monitor</h3>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="time" hide />
            <YAxis hide />
            <Line type="monotone" dataKey="value" stroke="#4ade80" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
