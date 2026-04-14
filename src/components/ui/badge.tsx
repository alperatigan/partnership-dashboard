import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground',
        secondary:
          'bg-secondary text-secondary-foreground',
        destructive:
          'bg-destructive text-destructive-foreground',
        outline: 'border border-border text-foreground',
        success:
          'bg-[#00A303]/10 text-[#00A303] border border-[#00A303]/20',
        warning:
          'bg-[#FF8C00]/10 text-[#FF8C00] border border-[#FF8C00]/20',
        error:
          'bg-[#E61E00]/10 text-[#E61E00] border border-[#E61E00]/20',
        silver:
          'bg-[#9CA3AF]/10 text-[#6B7280] border border-[#9CA3AF]/20',
        gold:
          'bg-[#FFC439]/20 text-[#B8860B] border border-[#FFC439]/30',
        platinum:
          'bg-[#003087]/10 text-[#003087] border border-[#003087]/20',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
