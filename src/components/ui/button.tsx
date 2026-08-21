import { ButtonHTMLAttributes, forwardRef, HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-accent-foreground font-semibold shadow-sm hover:brightness-110 hover:shadow-[0_0_20px_hsl(var(--accent)/0.4)]',
        glow:
          'bg-gradient-to-r from-glow/20 to-accent/20 text-foreground border border-glow/40 hover:border-glow hover:bg-glow/25 shadow-[0_0_15px_hsl(var(--glow)/0.15)]',
        secondary:
          'bg-white/10 text-foreground hover:bg-white/15 border border-white/10',
        outline:
          'border border-border-strong bg-white/5 text-foreground hover:bg-white/10 hover:border-glow/50',
        ghost:
          'text-foreground/70 hover:text-foreground hover:bg-white/10',
        danger:
          'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 hover:border-red-500/50',
      },
      size: {
        default: 'h-10 px-4 py-2 text-sm',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-12 px-6 text-base font-semibold',
        icon: 'h-9 w-9 p-0',
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

export const Card = ({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      'glass rounded-xl border border-border transition-all duration-200',
      className
    )}
    {...props}
  />
);
