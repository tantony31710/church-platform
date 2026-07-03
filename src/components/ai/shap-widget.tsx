import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Card } from '@/components/ui/button';

interface ShapFeature {
  name: string;
  value: number;
}

interface ShapWidgetProps {
  features: ShapFeature[];
}

export const ShapWidget: React.FC<ShapWidgetProps> = ({ features }) => {
  return (
    <Card className="p-4">
      <h3 className="font-medium text-lg mb-4">SHAP Feature Importance</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={features} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" />
            <Tooltip />
            <Bar dataKey="value">
              {features.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#4ade80' : '#f87171'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};
