import { Mic } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

import { Text } from '@/components/ui/text';
import type { PttPhase } from '@/lib/use-push-to-talk';
import { cn } from '@/lib/utils';

interface PttButtonProps {
  phase: PttPhase;
  onPressIn: () => void;
  onPressOut: () => void;
  label?: string;
  size?: 'default' | 'large';
}

/** The hold-to-talk control: press and hold to record, release to send. */
export function PttButton({ phase, onPressIn, onPressOut, label, size = 'default' }: PttButtonProps) {
  const recording = phase === 'recording';
  const sending = phase === 'sending';
  const dim = size === 'large' ? 'h-44 w-44' : 'h-20 w-20';
  return (
    <View className="items-center gap-3">
      <Pressable
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={sending}
        className={cn(
          'items-center justify-center rounded-full border-4',
          dim,
          recording ? 'border-accent bg-accent/20' : 'border-primary bg-primary/10',
          sending && 'opacity-50',
        )}>
        {sending ? (
          <ActivityIndicator color="#38bdf8" />
        ) : (
          <Mic size={size === 'large' ? 64 : 28} color={recording ? '#f97316' : '#38bdf8'} />
        )}
      </Pressable>
      <Text className="text-sm text-muted">
        {recording ? 'Recording — release to send' : sending ? 'Sending…' : (label ?? 'Hold to talk')}
      </Text>
      {phase === 'error' && <Text className="text-xs text-red-400">Send failed — check transport</Text>}
    </View>
  );
}
