'use client';

import { motion } from 'framer-motion';

// template.tsx (not layout.tsx) re-mounts on every route change, which
// is what makes an enter animation re-trigger each time you switch
// tabs. layout.tsx persists across navigations and would only
// animate once, on first load.
export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
