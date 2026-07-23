import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSyncExternalStore } from 'react';

import type { Speaker, TransportKind } from '@/lib/types';

export interface Settings {
  /** Base URL of the castd daemon, reachable over the tailnet. */
  castdUrl: string;
  /** 'auto' probes castd and falls back to direct; the others force a transport. */
  transportOverride: 'auto' | TransportKind;
}

export const DEFAULT_SETTINGS: Settings = {
  castdUrl: 'http://riva:8811',
  transportOverride: 'auto',
};

const SETTINGS_KEY = 'intercom.settings';
const DEVICES_KEY = 'intercom.lastDevices';

let current: Settings = DEFAULT_SETTINGS;
let loaded = false;
const listeners = new Set<() => void>();

async function load(): Promise<void> {
  if (loaded) return;
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (raw) current = { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  loaded = true;
  listeners.forEach((l) => l());
}

const loading = load();

export function getSettings(): Settings {
  return current;
}

export async function settingsReady(): Promise<Settings> {
  await loading;
  return current;
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  await loading;
  current = { ...current, ...patch };
  listeners.forEach((l) => l());
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(current));
  return current;
}

export function useSettings(): Settings {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    () => current,
  );
}

/**
 * Last-known device list, persisted so the widget (which runs headless, possibly with
 * castd unreachable) always has names to render.
 */
export async function persistLastDevices(devices: Speaker[]): Promise<void> {
  await AsyncStorage.setItem(DEVICES_KEY, JSON.stringify(devices));
}

export async function loadLastDevices(): Promise<Speaker[]> {
  const raw = await AsyncStorage.getItem(DEVICES_KEY);
  return raw ? (JSON.parse(raw) as Speaker[]) : [];
}
