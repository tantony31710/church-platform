import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface QrGeneratorProps {
  eventId: string;
}

export function QrGenerator({ eventId }: QrGeneratorProps) {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const generateToken = async () => {
      const newToken = crypto.randomUUID();
      setToken(newToken);
      await setDoc(doc(db, 'activeSessions', eventId), {
        currentToken: newToken,
        updatedAt: serverTimestamp(),
      });
    };

    generateToken();
    const interval = setInterval(generateToken, 30_000);
    return () => clearInterval(interval);
  }, [eventId]);

  if (!token) return <p className="text-sm text-foreground/50">Generating code...</p>;

  const scanUrl = `${window.location.origin}/attendance/scan?event=${eventId}&token=${token}`;

  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-lg glass glow-ring">
      <AnimatePresence mode="wait">
        <motion.div
          key={token}
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.35 }}
          className="rounded-md bg-white p-3"
        >
          <QRCodeSVG value={scanUrl} size={220} />
        </motion.div>
      </AnimatePresence>
      <div className="flex items-center gap-2 text-xs text-foreground/40">
        <motion.span
          className="h-1.5 w-1.5 rounded-full bg-glow"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
        Refreshes every 30 seconds
      </div>
    </div>
  );
}
