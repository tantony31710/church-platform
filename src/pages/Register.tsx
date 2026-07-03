import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { Button, Card } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import { UserPlus, Check } from 'lucide-react';

const COMMON_SKILLS = [
  'AV / Tech', 'Organization', 'Music', 'Teaching', 'Cleaning', 
  'Hospitality', 'Childcare', 'Administration', 'Creative/Design', 'Maintenance'
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        role: 'volunteer',
        skills: selectedSkills,
        points: 0,
      });

      navigate('/tasks');
    } catch (err) {
      console.error(err);
      setError('Could not create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-lg"
      >
        <TiltCard>
          <Card className="p-8 glow-ring">
            <div className="flex flex-col items-center mb-8 text-center">
              <div className="p-3 rounded-full bg-glow/20 text-glow mb-4">
                <UserPlus className="h-8 w-8" />
              </div>
              <h1 className="text-2xl font-medium text-foreground">Join the Community</h1>
              <p className="text-sm text-foreground/50 mt-2">
                Create your volunteer profile to start contributing and earning points.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-md border border-border bg-white/5 px-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 transition-colors"
                  required
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-10 rounded-md border border-border bg-white/5 px-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 transition-colors"
                  required
                />
              </div>
              
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-md border border-border bg-white/5 px-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 transition-colors"
                required
              />

              <div className="flex flex-col gap-3">
                <label className="text-xs font-medium text-foreground/60 uppercase tracking-wider">
                  Your Skills (Select all that apply)
                </label>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SKILLS.map(skill => (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`px-3 py-1.5 rounded-full text-xs transition-all border ${
                        selectedSkills.includes(skill) 
                          ? 'bg-glow/20 border-glow text-glow' 
                          : 'bg-white/5 border-border text-foreground/50 hover:border-glow/30'
                      } flex items-center gap-1.5`}
                    >
                      {selectedSkills.includes(skill) && <Check className="h-3 w-3" />}
                      {skill}
                    </button>
                  ))}
                </div>
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}
              
              <Button type="submit" disabled={loading} className="w-full py-6 text-base">
                {loading ? 'Creating profile...' : 'Complete Registration'}
              </Button>
            </form>
          </Card>
        </TiltCard>
      </motion.div>
    </div>
  );
}
