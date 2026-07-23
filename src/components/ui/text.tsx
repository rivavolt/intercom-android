import * as Slot from '@rn-primitives/slot';
import React, { createContext, useContext } from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';

import { cn } from '@/lib/utils';

const TextClassContext = createContext<string | undefined>(undefined);

interface TextProps extends RNTextProps {
  asChild?: boolean;
  className?: string;
}

function Text({ className, asChild = false, ...props }: TextProps) {
  const textClass = useContext(TextClassContext);
  const Component = asChild ? Slot.Text : RNText;
  return <Component className={cn('text-base text-white', textClass, className)} {...props} />;
}

export { Text, TextClassContext };
