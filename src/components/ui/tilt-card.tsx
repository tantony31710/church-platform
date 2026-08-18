import { ReactNode, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

interface TiltCardProps {
  children: ReactNode;
  className?: string;
  /** Max tilt angle in degrees. Keep small (6-10) — large tilts feel gimmicky, not premium. */
  maxTilt?: number;
}

// A real 3D effect, not a CSS hover trick: tracks pointer position
// relative to the card's own bounding box, maps it to a rotateX/
// rotateY transform in 3D space (via CSS perspective), and springs
// back to flat on mouse leave. The moving gradient "sheen" layered on
// top sells the depth further — it's what makes glass/metal surfaces
// read as 3D under light in real design systems.
export function TiltCard({ children, className = '', maxTilt = 8 }: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const springX = useSpring(x, { stiffness: 220, damping: 22 });
  const springY = useSpring(y, { stiffness: 220, damping: 22 });

  const rotateX = useTransform(springY, [0, 1], [maxTilt, -maxTilt]);
  const rotateY = useTransform(springX, [0, 1], [-maxTilt, maxTilt]);
  const sheenX = useTransform(springX, [0, 1], ['0%', '100%']);
  const sheenY = useTransform(springY, [0, 1], ['0%', '100%']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ perspective: 800 }}
      className={className}
    >
      <motion.div
        style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
        className="relative h-full w-full"
      >
        {children}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: useTransform(
              [sheenX, sheenY],
              ([sx, sy]) =>
                `radial-gradient(circle at ${sx} ${sy}, hsl(var(--glow) / 0.15), transparent 60%)`
            ),
          }}
        />
      </motion.div>
    </motion.div>
  );
}
