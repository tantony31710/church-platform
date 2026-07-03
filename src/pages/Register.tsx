import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/client';
import { Button, Card } from '@/components/ui/button';
import { TiltCard } from '@/components/ui/tilt-card';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      // Must match the firestore.rules "create" condition: a user may
      // only create their own doc, at their own uid. role defaults to
      // 'volunteer' — promoting to 'admin' is an admin-only action.
      await setDoc(doc(db, 'users', cred.user.uid), {
        name,
        email,
        role: 'volunteer',
        skills: [],
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
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm"
      >
        <TiltCard>
          <Card className="p-6 glow-ring">
            <h1 className="text-lg font-medium mb-4 text-foreground">Create account</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-10 rounded-md border border-border bg-white/5 px-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-glow/50 transition-colors"
                required
              />
              {error && <p className="text-xs text-red-400">{error}</p>}
              <Button type="submit" disabled={loading}>
                {loading ? 'Creating account...' : 'Create account'}
              </Button>
            </form>
          </Card>
        </TiltCard>
      </motion.div>
    </div>
  );
}
