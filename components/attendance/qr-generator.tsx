'use client';

import { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface QrGeneratorProps {
  eventId: string;
}

// Generates a QR code encoding a URL like /attendance/scan?event=EVENT_ID.
// Volunteers scan it with their phone camera, which opens that route
// (build separately) where they're already logged in and it writes
// their own attendance record client-side per firestore.rules.
//
// The code rotates every 30s by embedding a short-lived token, so a
// photo of the screen from last week's session can't be reused.
export function QrGenerator({ eventId }: QrGeneratorProps) {
  const [token, setToken] = useState<string>('');

  useEffect(() => {
    const generateToken = async () => {
      const newToken = crypto.randomUUID();
      setToken(newToken);

      // Store the current valid token server-side so the scan route
      // can verify it hasn't expired before writing attendance.
      await setDoc(doc(db, 'activeSessions', eventId), {
        currentToken: newToken,
        updatedAt: serverTimestamp(),
      });
    };

    generateToken();
    const interval = setInterval(generateToken, 30_000);
    return () => clearInterval(interval);
  }, [eventId]);

  if (!token) return <p className="text-sm text-neutral-500">Generating code...</p>;

  const scanUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/attendance/scan?event=${eventId}&token=${token}`;

  return (
    <div className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border bg-white/60 backdrop-blur-glass">
      <QRCodeSVG value={scanUrl} size={220} />
      <p className="text-xs text-neutral-500">Refreshes every 30 seconds</p>
    </div>
  );
}
