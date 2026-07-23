import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Pressable, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { iconForModel } from '@/lib/device-icons';
import { useTransport } from '@/lib/transport-context';
import type { Speaker } from '@/lib/types';

export function DeviceCard({ device }: { device: Speaker }) {
  const router = useRouter();
  const { transport } = useTransport();
  const Icon = iconForModel(device.model);
  const [volume, setVolume] = useState(device.volume ?? 50);

  return (
    <Card className="flex-1 gap-3">
      <Pressable
        className="gap-3 active:opacity-70"
        onPress={() => router.push({ pathname: '/ptt/[device]', params: { device: device.id, name: device.name } })}>
        <View className="flex-row items-center justify-between">
          <Icon size={22} color={device.online ? '#38bdf8' : '#64748b'} />
          <View className={device.online ? 'h-2 w-2 rounded-full bg-online' : 'h-2 w-2 rounded-full bg-offline'} />
        </View>
        <View>
          <Text className="font-semibold" numberOfLines={1}>
            {device.name}
          </Text>
          <Text className="text-xs text-muted" numberOfLines={1}>
            {device.nowPlaying ?? device.model}
          </Text>
        </View>
      </Pressable>
      <Slider
        style={{ height: 28, marginHorizontal: -8 }}
        minimumValue={0}
        maximumValue={100}
        step={1}
        value={volume}
        onValueChange={setVolume}
        onSlidingComplete={(v) => transport.setVolume(device.id, v).catch(() => {})}
        minimumTrackTintColor="#38bdf8"
        maximumTrackTintColor="#26303c"
        thumbTintColor="#38bdf8"
        disabled={!device.online}
      />
    </Card>
  );
}
