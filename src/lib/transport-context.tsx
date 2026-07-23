import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { requestWidgetUpdate } from 'react-native-android-widget';

import { persistLastDevices, settingsReady, useSettings } from '@/lib/settings';
import { IntercomWidget } from '@/widget/intercom-widget';
import { CastdTransport } from '@/lib/transports/castd';
import { DirectCastTransport } from '@/lib/transports/direct';
import type { CastTransport, Speaker, TransportKind } from '@/lib/types';

const PROBE_TIMEOUT_MS = 1500;

interface TransportState {
  transport: CastTransport;
  /** The transport actually in use right now. */
  active: TransportKind;
  probing: boolean;
  devices: Speaker[];
  refresh: () => Promise<void>;
  /** True when castd answered the last probe, regardless of override. */
  castdReachable: boolean;
}

const TransportContext = createContext<TransportState | null>(null);

/** Probe castd with a short timeout; reachable castd wins unless overridden. */
async function probeCastd(castd: CastdTransport): Promise<boolean> {
  try {
    await castd.client.devices(PROBE_TIMEOUT_MS);
    return true;
  } catch {
    return false;
  }
}

export function TransportProvider({ children }: { children: React.ReactNode }) {
  const settings = useSettings();
  const [active, setActive] = useState<TransportKind>('castd');
  const [probing, setProbing] = useState(true);
  const [castdReachable, setCastdReachable] = useState(false);
  const [devices, setDevices] = useState<Speaker[]>([]);

  const castd = useMemo(() => new CastdTransport(settings.castdUrl), [settings.castdUrl]);
  const direct = useMemo(() => new DirectCastTransport(), []);
  const transport = active === 'castd' ? castd : direct;
  const generation = useRef(0);

  const refresh = useCallback(async () => {
    const gen = ++generation.current;
    setProbing(true);
    try {
      const { transportOverride } = await settingsReady();
      const reachable = await probeCastd(castd);
      if (gen !== generation.current) return;
      setCastdReachable(reachable);
      const kind: TransportKind =
        transportOverride === 'auto' ? (reachable ? 'castd' : 'direct') : transportOverride;
      setActive(kind);
      const chosen = kind === 'castd' ? castd : direct;
      try {
        const list = await chosen.listDevices();
        if (gen !== generation.current) return;
        setDevices(list);
        if (list.length > 0) {
          await persistLastDevices(list);
          // Keep home-screen widget tiles in sync with the freshest device list.
          requestWidgetUpdate({
            widgetName: 'Intercom',
            renderWidget: () => <IntercomWidget devices={list} />,
          }).catch(() => {});
        }
      } catch {
        if (gen === generation.current) setDevices([]);
      }
    } finally {
      if (gen === generation.current) setProbing(false);
    }
  }, [castd, direct]);

  // Re-probe on app focus so walking off the tailnet (or back onto it) flips the
  // transport without user action.
  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const value = useMemo(
    () => ({ transport, active, probing, devices, refresh, castdReachable }),
    [transport, active, probing, devices, refresh, castdReachable],
  );

  return <TransportContext.Provider value={value}>{children}</TransportContext.Provider>;
}

export function useTransport(): TransportState {
  const ctx = useContext(TransportContext);
  if (!ctx) throw new Error('useTransport outside TransportProvider');
  return ctx;
}
