/** A speaker as the app sees it, normalized across castd and direct Cast discovery. */
export interface Speaker {
  /** Stable identifier: castd device id in castd mode, Cast deviceId in direct mode. */
  id: string;
  name: string;
  model: string;
  ip: string;
  online: boolean;
  /** 0..100 when known. */
  volume?: number;
  /** Human-readable now-playing line when known. */
  nowPlaying?: string;
}

export type TransportKind = 'castd' | 'direct';

/** How to reach the speakers. Selected by probing castd, overridable in settings. */
export interface CastTransport {
  readonly kind: TransportKind;
  listDevices(): Promise<Speaker[]>;
  /**
   * Send a recorded clip (a local file:// uri) to one or more speakers. The transport is
   * responsible for making the audio reachable by the speaker: castd spools it server-side,
   * direct mode serves it from an embedded HTTP server on the phone's WLAN IP.
   */
  sendClip(deviceIds: string[], fileUri: string, contentType: string): Promise<void>;
  setVolume(deviceId: string, percent: number): Promise<void>;
  stop(deviceId: string): Promise<void>;
}

export interface CastdDeviceWire {
  id: string;
  name: string;
  model: string;
  ip: string;
  port: number;
  online: boolean;
  connected?: boolean;
}

export type CastdEvent =
  | { event: 'device_up'; device: CastdDeviceWire }
  | { event: 'device_down'; id: string }
  | { event: 'connected'; ip: string }
  | { event: 'disconnected'; ip: string; reason: string }
  | { event: 'receiver_status'; ip: string; status: unknown }
  | { event: 'media_status'; ip: string; status: unknown[] }
  | { event: 'mode_changed'; app_warm: boolean };
