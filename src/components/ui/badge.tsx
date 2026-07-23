import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { View, type ViewProps } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const badgeVariants = cva('flex-row items-center gap-1.5 rounded-full px-2.5 py-1', {
  variants: {
    variant: {
      default: 'bg-primary/15',
      warning: 'bg-accent/15',
      muted: 'bg-border/40',
    },
  },
  defaultVariants: { variant: 'default' },
});

const badgeTextVariants = cva('text-xs font-medium', {
  variants: {
    variant: {
      default: 'text-primary',
      warning: 'text-accent',
      muted: 'text-muted',
    },
  },
  defaultVariants: { variant: 'default' },
});

interface BadgeProps extends ViewProps, VariantProps<typeof badgeVariants> {
  className?: string;
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <TextClassContext.Provider value={badgeTextVariants({ variant })}>
      <View className={cn(badgeVariants({ variant }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Badge };
