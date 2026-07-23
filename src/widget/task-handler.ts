import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';

import { loadLastDevices } from '@/lib/settings';
import { IntercomWidget } from '@/widget/intercom-widget';

/**
 * Renders widgets headlessly from the last-known device list in AsyncStorage — no castd
 * probe here, so the widget populates instantly and works offline. Tile taps are
 * OPEN_URI deep links handled by the OS, not this handler.
 */
export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const devices = await loadLastDevices();
      props.renderWidget(React.createElement(IntercomWidget, { devices }));
      break;
    }
    default:
      break;
  }
}
