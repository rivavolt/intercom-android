import { Link } from 'expo-router';
import { RefreshCw, Settings as SettingsIcon } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { FlatList, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeviceCard } from '@/components/device-card';
import { PttButton } from '@/components/ptt-button';
import { TransportBadge } from '@/components/transport-badge';
import { Text } from '@/components/ui/text';
import { useTransport } from '@/lib/transport-context';
import { usePushToTalk } from '@/lib/use-push-to-talk';

export default function DeviceGridScreen() {
  const { devices, probing, refresh } = useTransport();
  const insets = useSafeAreaInsets();
  const onlineIds = useMemo(() => devices.filter((d) => d.online).map((d) => d.id), [devices]);
  const broadcast = usePushToTalk(onlineIds);

  return (
    <View className="flex-1 bg-background px-4" style={{ paddingBottom: insets.bottom + 16 }}>
      <View className="flex-row items-center justify-between py-3">
        <TransportBadge />
        <View className="flex-row items-center gap-4">
          <Pressable onPress={() => refresh()} className="active:opacity-60" hitSlop={8}>
            <RefreshCw size={20} color="#8b98a5" />
          </Pressable>
          <Link href="/settings" asChild>
            <Pressable className="active:opacity-60" hitSlop={8}>
              <SettingsIcon size={20} color="#8b98a5" />
            </Pressable>
          </Link>
        </View>
      </View>

      <FlatList
        data={devices}
        keyExtractor={(d) => d.id}
        numColumns={2}
        columnWrapperClassName="gap-3"
        contentContainerClassName="gap-3 pb-4"
        renderItem={({ item }) => <DeviceCard device={item} />}
        ListEmptyComponent={
          <View className="items-center py-16">
            <Text className="text-muted">{probing ? 'Looking for speakers…' : 'No speakers found'}</Text>
          </View>
        }
      />

      <View className="items-center pt-2">
        <PttButton
          phase={broadcast.phase}
          onPressIn={broadcast.start}
          onPressOut={broadcast.stop}
          label={`Broadcast to ${onlineIds.length} speaker${onlineIds.length === 1 ? '' : 's'}`}
        />
      </View>
    </View>
  );
}
