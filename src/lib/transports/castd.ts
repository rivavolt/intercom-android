import { File } from 'expo-file-system';

import { CastdClient } from '@/lib/castd/client';
import type { CastTransport, Speaker } from '@/lib/types';

export function toSpeaker(d: {
  id: string;
  name: string;
  model: string;
  ip: string;
  online: boolean;
}): Speaker {
  return { id: d.id, name: d.name, model: d.model, ip: d.ip, online: d.online };
}

/** Primary transport: everything goes through the castd daemon over the tailnet. */
export class CastdTransport implements CastTransport {
  readonly kind = 'castd' as const;
  readonly client: CastdClient;

  constructor(baseUrl: string) {
    this.client = new CastdClient(baseUrl);
  }

  async listDevices(): Promise<Speaker[]> {
    const { devices } = await this.client.devices();
    return devices.map(toSpeaker);
  }

  async sendClip(deviceIds: string[], fileUri: string, contentType: string): Promise<void> {
    const bytes = await new File(fileUri).bytes();
    // cast-file spools once per call; reuse the spooled URL for the remaining devices so a
    // broadcast uploads the clip a single time.
    const [first, ...rest] = deviceIds;
    if (!first) return;
    const { url } = await this.client.castFile(first, bytes, contentType);
    await Promise.all(rest.map((d) => this.client.cast(d, url, contentType)));
  }

  async setVolume(deviceId: string, percent: number): Promise<void> {
    await this.client.volume(deviceId, Math.round(percent));
  }

  async stop(deviceId: string): Promise<void> {
    await this.client.stop(deviceId);
  }
}
