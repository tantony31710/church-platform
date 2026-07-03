import { useState } from 'react';
import { motion } from 'framer-motion';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { Plus } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { Button, Card } from '@/components/ui/button';

const inputClass =
  'h-10 rounded-md border border-border bg-white/5 px-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 transition-colors';

// Security note: this write is only reachable in the UI by an admin
// (the /admin route itself is role-gated), but the real enforcement
// is firestore.rules — "allow create: if isAdmin()" on the tasks
// collection. A non-admin who somehow called this code directly would
// still be rejected server-side.
export function TaskForm({ onCreated }: { onCreated?: () => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requiredSkill, setRequiredSkill] = useState('');
  const [deadline, setDeadline] = useState('');
  const [pointsValue, setPointsValue] = useState(10);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title,
        description,
        requiredSkill,
        deadline: Timestamp.fromDate(new Date(deadline)),
        pointsValue: Number(pointsValue),
        status: 'open',
        assignedTo: null,
      });
      setTitle('');
      setDescription('');
      setRequiredSkill('');
      setDeadline('');
      setPointsValue(10);
      onCreated?.();
    } catch (err) {
      console.error('Error creating task:', err);
      setError('Could not create task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-5">
      <h2 className="text-sm font-medium text-foreground mb-4">New task</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass}
          required
        />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={`${inputClass} h-20 py-2 resize-none`}
          required
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            placeholder="Required skill"
            value={requiredSkill}
            onChange={(e) => setRequiredSkill(e.target.value)}
            className={inputClass}
            required
          />
          <input
            type="number"
            min={1}
            placeholder="Points"
            value={pointsValue}
            onChange={(e) => setPointsValue(Number(e.target.value))}
            className={inputClass}
            required
          />
        </div>
        <input
          type="date"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
          className={`${inputClass} text-foreground/80`}
          required
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <Button type="submit" disabled={submitting} className="gap-2">
          {submitting ? (
            'Creating...'
          ) : (
            <>
              <Plus className="h-4 w-4" /> Create task
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
