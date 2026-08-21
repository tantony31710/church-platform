import { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Task, UserProfile } from '@/lib/types';
import { DataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';
import { TaskCard } from './task-card';
import { TaskDetailModal } from './task-detail-modal';
import { TaskCardSkeleton } from '@/components/ui/skeleton';
import {
  Search,
  Filter,
  CheckCircle2,
  ListTodo,
  Sparkles,
  AlertCircle,
  FolderKanban,
  Clock,
  Award,
  Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';

type TabView = 'open' | 'my-tasks' | 'completed';

const CATEGORIES = [
  'All',
  'AV & Tech',
  'Music & Worship',
  'Hospitality',
  'Youth & Childcare',
  'Facilities & Setup',
  'Admin & Outreach',
];

export function TaskList() {
  const { profile } = useAuth();
  const { showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>(() => DataService.getTasks());
  const [activeTab, setActiveTab] = useState<TabView>('open');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterMySkillsOnly, setFilterMySkillsOnly] = useState<boolean>(false);
  const [filterUrgentOnly, setFilterUrgentOnly] = useState<boolean>(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [volunteeringId, setVolunteeringId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = DataService.subscribe<Task[]>('tasks', (newTasks) => {
      setTasks(newTasks);
      // Keep selected modal task fresh
      if (selectedTask) {
        const fresh = newTasks.find((t) => t.id === selectedTask.id);
        if (fresh) setSelectedTask(fresh);
      }
    });
    return () => unsub();
  }, [selectedTask]);

  const handleVolunteer = (taskId: string) => {
    if (!profile) {
      showToast('Please log in to volunteer.', 'error');
      return;
    }
    setVolunteeringId(taskId);
    try {
      const updated = DataService.volunteerForTask(taskId, profile);
      if (updated) {
        showToast(`Signed up for "${updated.title}"! (+${updated.pointsValue} pts when completed)`);
      }
    } catch (e) {
      console.error(e);
      showToast('Could not sign up. Please try again.', 'error');
    } finally {
      setVolunteeringId(null);
    }
  };

  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    DataService.toggleSubtask(taskId, subtaskId);
  };

  const handleCompleteTask = (taskId: string) => {
    const result = DataService.completeTask(taskId);
    if (result) {
      showToast(`🎉 Task completed! +${result.pointsAwarded} points awarded to your profile!`);
      setSelectedTask(null);
    }
  };

  // Filtered Tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Tab filter
      if (activeTab === 'open' && task.status !== 'open') return false;
      if (activeTab === 'my-tasks' && task.assignedTo !== profile?.id) return false;
      if (activeTab === 'completed' && task.status !== 'completed') return false;

      // Category filter
      if (selectedCategory !== 'All' && task.category !== selectedCategory) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description.toLowerCase().includes(q);
        const matchesSkill = task.requiredSkill.toLowerCase().includes(q);
        const matchesTag = task.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesTitle && !matchesDesc && !matchesSkill && !matchesTag) return false;
      }

      // My Skills filter
      if (filterMySkillsOnly && profile?.skills) {
        const matchesAnySkill = profile.skills.some(
          (s) =>
            s.toLowerCase().includes(task.requiredSkill.toLowerCase()) ||
            task.requiredSkill.toLowerCase().includes(s.toLowerCase()) ||
            task.tags?.some((t) => t.toLowerCase().includes(s.toLowerCase()))
        );
        if (!matchesAnySkill) return false;
      }

      // Urgent filter
      if (filterUrgentOnly && task.priority !== 'urgent' && task.priority !== 'high') {
        return false;
      }

      return true;
    });
  }, [tasks, activeTab, selectedCategory, searchQuery, filterMySkillsOnly, filterUrgentOnly, profile]);

  const openCount = tasks.filter((t) => t.status === 'open').length;
  const myTasksCount = tasks.filter((t) => t.assignedTo === profile?.id && t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Filter & Tab Bar */}
      <div className="flex flex-col gap-4">
        {/* Main Tab Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-border/80">
          <div className="flex p-1 rounded-xl glass border border-border">
            <button
              onClick={() => setActiveTab('open')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'open'
                  ? 'bg-glow/20 text-glow border border-glow/30 shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <ListTodo className="h-3.5 w-3.5" />
              <span>Available Tasks</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-bold">
                {openCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('my-tasks')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'my-tasks'
                  ? 'bg-glow/20 text-glow border border-glow/30 shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>My Tasks</span>
              {myTasksCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-glow text-background text-[10px] font-black">
                  {myTasksCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('completed')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'completed'
                  ? 'bg-glow/20 text-glow border border-glow/30 shadow-sm'
                  : 'text-foreground/60 hover:text-foreground'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Completed</span>
              <span className="px-1.5 py-0.2 rounded-full bg-white/10 text-[10px] font-bold">
                {completedCount}
              </span>
            </button>
          </div>

          {/* Quick Filter Toggles */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterMySkillsOnly(!filterMySkillsOnly)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                filterMySkillsOnly
                  ? 'border-glow bg-glow/15 text-glow font-semibold'
                  : 'border-border text-foreground/60 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>My Skills Match</span>
            </button>

            <button
              onClick={() => setFilterUrgentOnly(!filterUrgentOnly)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
                filterUrgentOnly
                  ? 'border-red-500/50 bg-red-500/15 text-red-400 font-semibold'
                  : 'border-border text-foreground/60 hover:text-foreground hover:bg-white/5'
              }`}
            >
              <AlertCircle className="h-3.5 w-3.5" />
              <span>Urgent Only</span>
            </button>
          </div>
        </div>

        {/* Search & Category Pills */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
            <input
              type="text"
              placeholder="Search tasks by title, skill, department..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-9 pl-9 pr-4 rounded-xl border border-border bg-white/5 text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-glow/50 transition-colors"
            />
          </div>

          {/* Category Scroller */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:max-w-xl">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`text-xs px-3 py-1 rounded-full whitespace-nowrap transition-all border ${
                  selectedCategory === cat
                    ? 'bg-glow text-background font-bold border-glow shadow-sm'
                    : 'bg-white/5 border-border text-foreground/70 hover:text-foreground hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Task Grid */}
      {filteredTasks.length === 0 ? (
        <div className="p-12 text-center rounded-2xl glass border border-border/80 flex flex-col items-center justify-center">
          <div className="h-12 w-12 rounded-full bg-white/5 flex items-center justify-center text-foreground/40 mb-3">
            <FolderKanban className="h-6 w-6" />
          </div>
          <h3 className="text-sm font-semibold text-foreground mb-1">No tasks match your filters</h3>
          <p className="text-xs text-foreground/50 max-w-sm mb-4">
            {activeTab === 'my-tasks'
              ? 'You have not claimed any tasks yet. Browse available tasks above to sign up!'
              : 'Try clearing your search query or selecting a different category.'}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setFilterMySkillsOnly(false);
              setFilterUrgentOnly(false);
              setActiveTab('open');
            }}
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <motion.div
          layout
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          <AnimatePresence mode="popLayout">
            {filteredTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                currentUser={profile}
                onVolunteer={handleVolunteer}
                onOpenDetails={setSelectedTask}
                isSubmitting={volunteeringId === task.id}
              />
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Task Detail & Checklist Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          currentUser={profile}
          onClose={() => setSelectedTask(null)}
          onVolunteer={handleVolunteer}
          onToggleSubtask={handleToggleSubtask}
          onComplete={handleCompleteTask}
          isSubmitting={volunteeringId === selectedTask.id}
        />
      )}
    </div>
  );
}
