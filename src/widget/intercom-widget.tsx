import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

import type { Speaker } from '@/lib/types';

/**
 * Home-screen widget: one quick-send tile per speaker. Tapping a tile deep-links straight
 * into the PTT screen for that device; the app then works over whichever transport is
 * reachable, so the widget is useful even with castd down.
 */
export function IntercomWidget({ devices }: { devices: Speaker[] }) {
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        backgroundColor: '#0b0f14',
        borderRadius: 24,
        padding: 8,
      }}>
      {devices.length === 0 ? (
        <FlexWidget
          clickAction="OPEN_APP"
          style={{ flex: 1, height: 'match_parent', justifyContent: 'center', alignItems: 'center' }}>
          <TextWidget text="Intercom — open to find speakers" style={{ fontSize: 13, color: '#8b98a5' }} />
        </FlexWidget>
      ) : (
        devices.map((device) => (
          <FlexWidget
            key={device.id}
            clickAction="OPEN_URI"
            clickActionData={{
              uri: `intercom://ptt/${encodeURIComponent(device.id)}?name=${encodeURIComponent(device.name)}`,
            }}
            style={{
              backgroundColor: '#151b23',
              borderRadius: 16,
              margin: 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'row',
              flexGap: 6,
            }}>
            <TextWidget text="🎙" style={{ fontSize: 14, color: '#38bdf8' }} />
            <TextWidget text={device.name} style={{ fontSize: 13, color: '#ffffff' }} />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
