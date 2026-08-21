import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { Button, Card } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import { UserPlus, Check, HeartHandshake, Sparkles } from 'lucide-react';
import { DataService } from '@/lib/data-service';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

const COMMON_SKILLS = [
  'AV / Tech',
  'Music & Vocals',
  'Hospitality & Greeter',
  'Teaching & Kids',
  'Facilities & Setup',
  'Administration & Social',
  'Prayer & Outreach',
  'First Aid / Safety',
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setCustomUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['AV / Tech']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      showToast('Please enter your name and email.', 'error');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      try {
        const cred = await createUserWithEmailAndPassword(auth, email, password || 'password123');
        await setDoc(doc(db, 'users', cred.user.uid), {
          name,
          email,
          role: 'volunteer',
          skills: selectedSkills,
          points: 15,
        });
      } catch (fbErr) {
        console.warn('Firebase register bypassed to local state:', fbErr);
      }

      // Also register in local state immediately
      const newUser = DataService.registerUser({
        name: name.trim(),
        email: email.trim(),
        role: 'volunteer',
        skills: selectedSkills,
        points: 15, // Welcome bonus points
      });

      setCustomUser(newUser);
      showToast(`Welcome ${name}! You received +15 welcome points.`);
      navigate('/tasks');
    } catch (err) {
      console.error(err);
      setError('Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <TiltCard>
          <Card className="p-7 glass-strong border border-border-strong rounded-2xl shadow-2xl">
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-accent/40 via-glow/30 to-white/10 flex items-center justify-center border border-glow/30 mb-3 shadow-[0_0_15px_hsl(var(--glow)/0.2)]">
                <UserPlus className="h-6 w-6 text-glow" />
              </div>
              <h1 className="text-xl font-bold text-foreground">Join Our Serving Family</h1>
              <p className="text-xs text-foreground/50 mt-1">
                Create your volunteer profile, choose your giftings, and earn service points
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Jordan Miller"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50"
                    required
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    placeholder="jordan@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full h-10 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50"
                  required
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-foreground/70 uppercase block mb-2">
                  Select Your Serving Interests & Skills (AI Matchmaking)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.map((skill) => {
                    const isSelected = selectedSkills.includes(skill);
                    return (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => toggleSkill(skill)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-glow/20 text-glow border border-glow/40 shadow-sm'
                            : 'bg-white/5 text-foreground/60 border border-border hover:border-glow/30 hover:text-foreground'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3" />}
                        {skill}
                      </button>
                    );
                  })}
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full font-bold mt-2">
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? 'Creating Profile...' : 'Complete Registration (+15 Welcome Pts)'}
              </Button>
            </form>

            <p className="text-center text-xs text-foreground/50 mt-5">
              Already have an account?{' '}
              <Link to="/login" className="text-glow font-semibold hover:underline">
                Sign in here
              </Link>
            </p>
          </Card>
        </TiltCard>
      </motion.div>
    </div>
  );
}
