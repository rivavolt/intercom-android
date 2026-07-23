import React from 'react';
import { View, type ViewProps } from 'react-native';

import { cn } from '@/lib/utils';

interface CardProps extends ViewProps {
  className?: string;
}

function Card({ className, ...props }: CardProps) {
  return <View className={cn('rounded-2xl border border-border bg-surface p-4', className)} {...props} />;
}

export { Card };
