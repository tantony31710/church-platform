import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';
import { Button, Card } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import { User, ShieldCheck, HeartHandshake, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useToast } from '@/lib/toast-context';

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginDemo } = useAuth();
  const { showToast } = useToast();
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
      showToast('Signed in successfully!');
      navigate('/tasks');
    } catch (err: any) {
      console.warn('Firebase signin fallback to demo mode:', err);
      // Fallback demo signin
      loginDemo('volunteer');
      showToast('Signed in with Volunteer demo profile!');
      navigate('/tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = (role: 'admin' | 'volunteer') => {
    loginDemo(role);
    showToast(`Signed in as ${role === 'admin' ? 'Pastor David (Admin)' : 'Alex Rivera (Volunteer)'}!`);
    navigate(role === 'admin' ? '/admin' : '/tasks');
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <TiltCard>
          <Card className="p-7 glass-strong border border-border-strong rounded-2xl shadow-2xl">
            {/* Church Brand */}
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-accent/40 via-glow/30 to-white/10 flex items-center justify-center border border-glow/30 shadow-[0_0_15px_hsl(var(--glow)/0.2)] mb-3">
                <HeartHandshake className="h-6 w-6 text-glow" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Church<span className="text-glow">Connect</span>
              </h1>
              <p className="text-xs text-foreground/50 mt-1">
                Volunteer Service & Ministry Engagement Portal
              </p>
            </div>

            {/* 1-Click Fast Demo Login Buttons */}
            <div className="space-y-2 mb-6 p-3 rounded-xl bg-white/5 border border-border">
              <p className="text-[10px] uppercase font-bold text-foreground/40 text-center tracking-wider mb-2">
                ⚡ Instant Demo Persona Access
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="glow"
                  size="sm"
                  onClick={() => handleQuickDemo('volunteer')}
                  className="w-full text-xs font-semibold"
                >
                  <User className="h-3.5 w-3.5 mr-1.5" />
                  Volunteer View
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => handleQuickDemo('admin')}
                  className="w-full text-xs font-semibold"
                >
                  <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-purple-400" />
                  Leader / Admin
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-4 text-[10px] uppercase font-bold text-foreground/30">
              <div className="h-px bg-border flex-1" />
              <span>Or sign in with email</span>
              <div className="h-px bg-border flex-1" />
            </div>

            {/* Email Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div>
                <input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-10 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50"
                  required
                />
              </div>

              {error && <p className="text-xs text-red-400">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full font-bold mt-1">
                {loading ? 'Authenticating...' : 'Sign In'}
              </Button>
            </form>

            <p className="text-center text-xs text-foreground/50 mt-5">
              New volunteer in the community?{' '}
              <Link to="/register" className="text-glow font-semibold hover:underline">
                Create an account
              </Link>
            </p>
          </Card>
        </TiltCard>
      </motion.div>
    </div>
  );
}
