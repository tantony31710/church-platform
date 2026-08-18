import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button, Card } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import { User, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'volunteer' | 'admin'>('volunteer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Redirect based on mode, though DashboardLayout handles role gating
      navigate(mode === 'admin' ? '/admin' : '/tasks');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <TiltCard>
          <Card className="p-6 glow-ring">
            <div className="flex flex-col items-center mb-6">
              <div className="flex p-1 rounded-lg glass mb-6 w-full">
                <button
                  onClick={() => setMode('volunteer')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'volunteer' ? 'bg-white/10 text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground'
                  }`}
                >
                  <User className="h-4 w-4" /> Volunteer
                </button>
                <button
                  onClick={() => setMode('admin')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                    mode === 'admin' ? 'bg-white/10 text-foreground shadow-sm' : 'text-foreground/50 hover:text-foreground'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" /> Admin
                </button>
              </div>
              <h1 className="text-lg font-medium text-foreground">
                {mode === 'admin' ? 'Church Leadership Portal' : 'Volunteer Portal'}
              </h1>
              <p className="text-xs text-foreground/40 mt-1">Sign in to manage your community impact</p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-10 rounded-md border border-border bg-white/5 px-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 transition-colors"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-md border border-border bg-white/5 px-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 transition-colors"
                required
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? 'Authenticating...' : `Enter ${mode === 'admin' ? 'Admin' : 'Volunteer'} Portal`}
              </Button>
            </form>
          </Card>
        </TiltCard>
      </motion.div>
    </div>
  );
}

