import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, firebaseConfigured } from '@/lib/firebase/client';
import { Button, Card } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';
import { HeartHandshake, ShieldCheck, Users } from 'lucide-react';
import { useToast } from '@/lib/toast-context';
import { normalizeAdminEmails } from '@/lib/admin-role';

type LoginMode = 'volunteer' | 'admin';

const designatedAdminEmails = normalizeAdminEmails(
  import.meta.env.VITE_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAIL,
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [mode, setMode] = useState<LoginMode>('volunteer');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleModeChange = (nextMode: LoginMode) => {
    setMode(nextMode);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    setError(null);

    if (!firebaseConfigured) {
      setError('Firebase is not configured. Add the production Firebase variables before signing in.');
      return;
    }
    const isConfiguredAdmin = designatedAdminEmails.includes(normalizedEmail);
    if (mode === 'admin' && !isConfiguredAdmin) {
      setError('This admin sign-in accepts only a church-approved administrator email.');
      return;
    }
    if (mode === 'volunteer' && isConfiguredAdmin) {
      setError('Use the Administrator tab for the designated administrator account.');
      return;
    }

    setLoading(true);
    try {
      const credential = await signInWithEmailAndPassword(auth, normalizedEmail, password);
      // Claims are assigned server-side by admin_bootstrap.py. Force a fresh
      // token before entering the protected admin route.
      await credential.user.getIdToken(true);
      showToast(mode === 'admin' ? 'Administrator signed in successfully.' : 'Signed in successfully.');
      navigate(mode === 'admin' ? '/admin' : '/tasks', { replace: true });
    } catch (err: any) {
      console.error('Firebase sign-in failed:', err);
      setError(
        err?.code === 'auth/invalid-credential'
          ? 'Email or password is incorrect.'
          : 'Could not sign in. Check the account and Firebase configuration.'
      );
    } finally {
      setLoading(false);
    }
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
            <div className="flex flex-col items-center mb-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-tr from-accent/40 via-glow/30 to-white/10 flex items-center justify-center border border-glow/30 shadow-[0_0_15px_hsl(var(--glow)/0.2)] mb-3">
                <HeartHandshake className="h-6 w-6 text-glow" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">
                Church<span className="text-glow">Connect</span>
              </h1>
              <p className="text-xs text-foreground/50 mt-1">Volunteer Service & Ministry Engagement Portal</p>
            </div>

            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-white/5 border border-border mb-4" role="tablist" aria-label="Sign-in type">
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'volunteer'}
                onClick={() => handleModeChange('volunteer')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  mode === 'volunteer' ? 'bg-glow/20 text-glow border border-glow/30' : 'text-foreground/55 hover:text-foreground'
                }`}
              >
                <Users className="h-3.5 w-3.5" /> Volunteer
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === 'admin'}
                onClick={() => handleModeChange('admin')}
                className={`flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-bold transition-colors ${
                  mode === 'admin' ? 'bg-purple-500/20 text-purple-200 border border-purple-400/30' : 'text-foreground/55 hover:text-foreground'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" /> Administrator
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-border bg-white/5 p-3 text-center text-[11px] text-foreground/60">
              {mode === 'admin'
                ? 'Administrator access is limited to the one church-designated email and Firebase admin claim.'
                : 'Volunteer accounts can sign in here. The administrator account must use the Administrator tab.'}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder={mode === 'admin' ? 'Designated admin email' : 'Volunteer email address'}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50"
                autoComplete="email"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-10 rounded-xl border border-border bg-white/5 px-3 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50"
                autoComplete={mode === 'admin' ? 'current-password' : 'current-password'}
                required
              />

              {error && <p className="text-xs text-red-400" role="alert">{error}</p>}

              <Button type="submit" disabled={loading} className="w-full font-bold mt-1">
                {loading ? 'Authenticating...' : mode === 'admin' ? 'Sign In as Administrator' : 'Sign In as Volunteer'}
              </Button>
            </form>

            <p className="text-center text-xs text-foreground/50 mt-5">
              New volunteer in the community?{' '}
              <Link to="/register" className="text-glow font-semibold hover:underline">Create an account</Link>
            </p>
          </Card>
        </TiltCard>
      </motion.div>
    </div>
  );
}
