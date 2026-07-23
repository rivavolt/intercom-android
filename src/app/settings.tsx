import React from 'react';
import { ScrollView, TextInput, View } from 'react-native';

import { TransportBadge } from '@/components/transport-badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { updateSettings, useSettings } from '@/lib/settings';
import { useTransport } from '@/lib/transport-context';

const OVERRIDES = [
  { value: 'auto', label: 'Auto (probe castd)' },
  { value: 'castd', label: 'Always castd' },
  { value: 'direct', label: 'Always direct' },
] as const;

export default function SettingsScreen() {
  const settings = useSettings();
  const { refresh, castdReachable } = useTransport();

  return (
    <ScrollView className="flex-1 bg-background px-4" contentContainerClassName="gap-4 py-4">
      <Card className="gap-2">
        <Text className="text-sm font-semibold text-muted">castd URL</Text>
        <TextInput
          className="rounded-xl border border-border bg-background px-3 py-2.5 text-white"
          defaultValue={settings.castdUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="http://riva:8811"
          placeholderTextColor="#64748b"
          onEndEditing={async (e) => {
            const url = e.nativeEvent.text.trim().replace(/\/+$/, '');
            if (url) {
              await updateSettings({ castdUrl: url });
              refresh();
            }
          }}
        />
        <Text className="text-xs text-muted">
          Reached over the tailnet. {castdReachable ? 'Currently reachable.' : 'Currently unreachable.'}
        </Text>
      </Card>

      <Card className="gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-muted">Transport</Text>
          <TransportBadge />
        </View>
        {OVERRIDES.map((o) => (
          <Button
            key={o.value}
            variant={settings.transportOverride === o.value ? 'default' : 'secondary'}
            onPress={async () => {
              await updateSettings({ transportOverride: o.value });
              refresh();
            }}>
            <Text>{o.label}</Text>
          </Button>
        ))}
        <Text className="text-xs text-muted">
          Auto probes castd on app focus and falls back to direct Google Cast (serverless, on-LAN) when the daemon is
          unreachable.
        </Text>
      </Card>
    </ScrollView>
  );
}
