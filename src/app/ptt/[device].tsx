import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useMemo } from 'react';
import { View } from 'react-native';

import { PttButton } from '@/components/ptt-button';
import { TransportBadge } from '@/components/transport-badge';
import { Text } from '@/components/ui/text';
import { iconForModel } from '@/lib/device-icons';
import { useTransport } from '@/lib/transport-context';
import { usePushToTalk } from '@/lib/use-push-to-talk';

/** Full-screen push-to-talk for one speaker. Deep-linked from the widget tiles. */
export default function PttScreen() {
  const params = useLocalSearchParams<{ device: string; name?: string }>();
  const { devices } = useTransport();
  const deviceIds = useMemo(() => (params.device ? [params.device] : []), [params.device]);
  const ptt = usePushToTalk(deviceIds);

  const device = devices.find((d) => d.id === params.device);
  const name = device?.name ?? params.name ?? params.device;
  const Icon = iconForModel(device?.model ?? '');

  return (
    <View className="flex-1 items-center justify-center gap-10 bg-background px-8">
      <Stack.Screen options={{ title: name }} />
      <View className="items-center gap-3">
        <Icon size={40} color="#38bdf8" />
        <Text className="text-2xl font-bold">{name}</Text>
        <TransportBadge />
      </View>
      <PttButton phase={ptt.phase} onPressIn={ptt.start} onPressOut={ptt.stop} size="large" />
    </View>
  );
}
