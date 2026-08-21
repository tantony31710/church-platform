import { useState } from 'react';
import { Button, Card } from '@/components/ui/button';
import { DataService } from '@/lib/data-service';
import { useToast } from '@/lib/toast-context';
import {
  Plus,
  Tag,
  Clock,
  MapPin,
  Calendar,
  ListCheck,
  Award,
  Sparkles,
  X
} from 'lucide-react';

const CATEGORIES = [
  'AV & Tech',
  'Music & Worship',
  'Hospitality',
  'Youth & Childcare',
  'Facilities & Setup',
  'Admin & Outreach',
];

export function TaskForm({ onCreated }: { onCreated?: () => void }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('AV & Tech');
  const [requiredSkill, setRequiredSkill] = useState('AV / Tech');
  const [deadline, setDeadline] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [pointsValue, setPointsValue] = useState(20);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'urgent'>('high');
  const [location, setLocation] = useState('Main Sanctuary');
  const [estimatedTime, setEstimatedTime] = useState(2);
  const [subtasks, setSubtasks] = useState<string[]>([
    'Setup & check equipment',
    'Execute assigned service tasks',
    'Pack up and debrief',
  ]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleAddSubtask = () => {
    if (newSubtaskInput.trim()) {
      setSubtasks([...subtasks, newSubtaskInput.trim()]);
      setNewSubtaskInput('');
    }
  };

  const handleRemoveSubtask = (idx: number) => {
    setSubtasks(subtasks.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      showToast('Please fill out all required task fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      DataService.createTask({
        title: title.trim(),
        description: description.trim(),
        category: category as any,
        requiredSkill: requiredSkill.trim() || category,
        deadline: new Date(deadline).toISOString(),
        pointsValue: Number(pointsValue) || 15,
        priority,
        location: location.trim() || 'Church Campus',
        estimatedTime: Number(estimatedTime) || 2,
        tags: [category, priority],
        subtasks,
      });

      showToast(`Created task "${title}" (+${pointsValue} pts)`);
      setTitle('');
      setDescription('');
      onCreated?.();
    } catch (err) {
      console.error('Error creating task:', err);
      showToast('Could not create task. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 glass-strong border border-border-strong rounded-2xl shadow-xl">
      <div className="flex items-center gap-2 mb-4 pb-3 border-b border-border/80">
        <div className="h-7 w-7 rounded-lg bg-glow/20 text-glow flex items-center justify-center font-bold">
          <Plus className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-foreground">Create Ministry Assignment</h2>
          <p className="text-[11px] text-foreground/50">Post new serving needs for Sunday or mid-week</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
            Task Title *
          </label>
          <input
            placeholder="e.g., Live Stream Video Director & PTZ Camera Operator"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
            Task Description & Volunteer Instructions *
          </label>
          <textarea
            placeholder="Describe the responsibilities, equipment to operate, and any prep needed..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-xl border border-border bg-white/5 p-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 resize-none"
            required
          />
        </div>

        {/* Category & Skill */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
              Ministry Department
            </label>
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setRequiredSkill(e.target.value);
              }}
              className="w-full h-9 rounded-xl border border-border bg-card-bg px-2.5 text-xs text-foreground focus:outline-none focus:border-glow/50"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-background text-foreground">
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as any)}
              className="w-full h-9 rounded-xl border border-border bg-card-bg px-2.5 text-xs text-foreground focus:outline-none focus:border-glow/50"
            >
              <option value="urgent" className="bg-background text-foreground">Urgent</option>
              <option value="high" className="bg-background text-foreground">High</option>
              <option value="medium" className="bg-background text-foreground">Medium</option>
              <option value="low" className="bg-background text-foreground">Low</option>
            </select>
          </div>
        </div>

        {/* Points & Deadline & Est Time */}
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
              Points Reward
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={pointsValue}
              onChange={(e) => setPointsValue(Number(e.target.value))}
              className="w-full h-9 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground focus:outline-none focus:border-glow/50 font-bold"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
              Est. Hours
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={estimatedTime}
              onChange={(e) => setEstimatedTime(Number(e.target.value))}
              className="w-full h-9 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground focus:outline-none focus:border-glow/50"
              required
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full h-9 rounded-xl border border-border bg-white/5 px-2.5 text-xs text-foreground focus:outline-none focus:border-glow/50"
              required
            />
          </div>
        </div>

        {/* Location */}
        <div>
          <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
            Campus Room / Location
          </label>
          <input
            placeholder="e.g. North Foyer / Room 204"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full h-9 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground focus:outline-none focus:border-glow/50"
          />
        </div>

        {/* Subtasks Checklist Builder */}
        <div>
          <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
            Action Items Checklist ({subtasks.length})
          </label>
          <div className="space-y-1.5 mb-2">
            {subtasks.map((st, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 p-2 rounded-lg bg-white/5 border border-border text-xs"
              >
                <span className="text-foreground/80 truncate">• {st}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveSubtask(i)}
                  className="text-foreground/40 hover:text-red-400 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add checklist item..."
              value={newSubtaskInput}
              onChange={(e) => setNewSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              className="flex-1 h-8 rounded-lg border border-border bg-white/5 px-3 text-xs text-foreground focus:outline-none focus:border-glow/50"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddSubtask}
              className="h-8 text-xs"
            >
              Add Item
            </Button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={submitting}
          className="w-full font-bold shadow-md"
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {submitting ? 'Publishing...' : 'Publish Ministry Assignment'}
        </Button>
      </form>
    </Card>
  );
}
