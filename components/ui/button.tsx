import { ButtonHTMLAttributes, forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-accent-foreground hover:shadow-[0_0_20px_hsl(var(--accent)/0.5)] hover:brightness-110',
        outline:
          'border border-border-strong bg-white/5 hover:bg-white/10 hover:border-glow/50',
        ghost: 'hover:bg-white/5',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button
      ref={ref}
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  )
);
Button.displayName = 'Button';

// Dark glass card — the base surface used across the dashboard
// (task cards, leaderboard rows, the 3D hub frame). `glass` is
// defined in globals.css: translucent background + backdrop blur,
// so content behind it (the page's radial gradients) shows through.
export const Card = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('glass rounded-lg', className)} {...props} />
);
