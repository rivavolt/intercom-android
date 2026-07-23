import { Radio, Server } from 'lucide-react-native';
import React from 'react';
import { ActivityIndicator } from 'react-native';

import { Badge } from '@/components/ui/badge';
import { Text } from '@/components/ui/text';
import { useTransport } from '@/lib/transport-context';

/** Shows which transport is live: castd over the tailnet, or direct Google Cast. */
export function TransportBadge() {
  const { active, probing } = useTransport();
  if (probing) {
    return (
      <Badge variant="muted">
        <ActivityIndicator size={12} color="#8b98a5" />
        <Text>probing</Text>
      </Badge>
    );
  }
  return active === 'castd' ? (
    <Badge>
      <Server size={12} color="#38bdf8" />
      <Text>castd</Text>
    </Badge>
  ) : (
    <Badge variant="warning">
      <Radio size={12} color="#f97316" />
      <Text>direct</Text>
    </Badge>
  );
}
