import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React from 'react';

import { TransportProvider } from '@/lib/transport-context';

import '../global.css';

export default function RootLayout() {
  return (
    <TransportProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0b0f14' },
          headerTintColor: '#ffffff',
          contentStyle: { backgroundColor: '#0b0f14' },
        }}>
        <Stack.Screen name="index" options={{ title: 'Intercom' }} />
        <Stack.Screen name="ptt/[device]" options={{ title: 'Push to talk' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </TransportProvider>
  );
}
