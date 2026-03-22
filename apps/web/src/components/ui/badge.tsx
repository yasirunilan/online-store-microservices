import { cn } from '@/lib/cn';
import { type HTMLAttributes } from 'react';

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

const variantStyles: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  destructive: 'border-transparent bg-destructive text-destructive-foreground',
  outline: 'text-foreground',
};

interface BadgeProps extends HTMLAttributes<HTMLDivElement> {
  variant?: BadgeVariant;
}

function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        variantStyles[variant],
        className,
      )}
      {...props}
    />
  );
}

export { Badge, type BadgeProps };
