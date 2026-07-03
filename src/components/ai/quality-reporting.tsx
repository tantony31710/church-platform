import React from 'react';
import { Card } from '@/components/ui/button';

export const QualityReporting: React.FC = () => {
  return (
    <Card className="p-4">
      <h3 className="font-medium text-lg mb-2">Automated Quality Reporting</h3>
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Data Completeness:</span>
          <span className="text-green-500 font-medium">98%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Data Accuracy:</span>
          <span className="text-green-500 font-medium">95%</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Latency:</span>
          <span className="text-yellow-500 font-medium">120ms</span>
        </div>
      </div>
    </Card>
  );
};
