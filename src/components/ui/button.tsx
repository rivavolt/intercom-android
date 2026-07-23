import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';
import { Pressable, type PressableProps } from 'react-native';

import { TextClassContext } from '@/components/ui/text';
import { cn } from '@/lib/utils';

const buttonVariants = cva('flex-row items-center justify-center gap-2 rounded-2xl active:opacity-80', {
  variants: {
    variant: {
      default: 'bg-primary',
      secondary: 'bg-surface border border-border',
      ghost: 'bg-transparent',
      destructive: 'bg-red-500',
    },
    size: {
      default: 'h-12 px-5',
      sm: 'h-9 px-3',
      lg: 'h-14 px-8',
      icon: 'h-12 w-12',
    },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

const buttonTextVariants = cva('text-base font-semibold', {
  variants: {
    variant: {
      default: 'text-slate-950',
      secondary: 'text-white',
      ghost: 'text-primary',
      destructive: 'text-white',
    },
    size: { default: '', sm: 'text-sm', lg: 'text-lg', icon: '' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
});

interface ButtonProps extends PressableProps, VariantProps<typeof buttonVariants> {
  className?: string;
}

function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <TextClassContext.Provider value={buttonTextVariants({ variant, size })}>
      <Pressable className={cn(buttonVariants({ variant, size }), className)} {...props} />
    </TextClassContext.Provider>
  );
}

export { Button, buttonVariants };
