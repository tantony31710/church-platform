import React, { useState } from 'react';
import { Card } from '@/modules/ui/button';
import { Button } from '@/modules/ui/button';

export const SyntheticDataGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const generateData = () => {
    setIsGenerating(true);
    // Simulate generation
    setTimeout(() => {
      setIsGenerating(false);
      alert('Synthetic data generated!');
    }, 2000);
  };

  return (
    <Card className="p-4">
      <h3 className="font-medium text-lg mb-2">Synthetic Data Generator</h3>
      <p className="text-sm text-foreground/60 mb-4">Generate synthetic data for testing models.</p>
      <Button onClick={generateData} disabled={isGenerating}>
        {isGenerating ? 'Generating...' : 'Generate Synthetic Data'}
      </Button>
    </Card>
  );
};
