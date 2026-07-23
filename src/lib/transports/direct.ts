import StaticServer from '@dr.pogodin/react-native-static-server';
import { Directory, File, Paths } from 'expo-file-system';
import * as Network from 'expo-network';
import GoogleCast, { CastContext, MediaStreamType } from 'react-native-google-cast';

import type { CastTransport, Speaker } from '@/lib/types';

const SERVE_PORT = 8817;

/**
 * Serverless fallback: discover speakers with the native Cast sender SDK and, for clips,
 * serve the recorded file from an embedded HTTP server bound to the phone's WLAN IP so
 * the speaker can pull it over the LAN — no castd, no cloud.
 */
export class DirectCastTransport implements CastTransport {
  readonly kind = 'direct' as const;

  private server?: StaticServer;
  private serveDir = new Directory(Paths.cache, 'intercom-serve');

  async listDevices(): Promise<Speaker[]> {
    const discovery = CastContext.getDiscoveryManager();
    await discovery.startDiscovery();
    const devices = await discovery.getDevices();
    return devices.map((d) => ({
      id: d.deviceId,
      name: d.friendlyName,
      model: d.modelName ?? 'Cast device',
      ip: d.ipAddress,
      // Discovery only surfaces reachable devices.
      online: true,
    }));
  }

  private async ensureServer(): Promise<string> {
    if (!this.serveDir.exists) this.serveDir.create({ intermediates: true });
    if (!this.server) {
      this.server = new StaticServer({
        fileDir: this.serveDir.uri.replace('file://', ''),
        port: SERVE_PORT,
        // Bind beyond loopback so the speaker can reach us over the LAN.
        nonLocal: true,
        stopInBackground: false,
      });
    }
    await this.server.start();
    const ip = await Network.getIpAddressAsync();
    return `http://${ip}:${SERVE_PORT}`;
  }

  async sendClip(deviceIds: string[], fileUri: string, contentType: string): Promise<void> {
    const src = new File(fileUri);
    const name = `clip-${Date.now()}.${src.extension ?? 'm4a'}`.replace(/\.\./, '.');
    await src.copy(new File(this.serveDir, name));
    const origin = await this.ensureServer();
    const url = `${origin}/${name}`;

    // The Play Services sender holds a single session at a time, so a broadcast in direct
    // mode is sequential: session per device, load, move on. castd is the transport that
    // does true simultaneous broadcast.
    const sessionManager = CastContext.getSessionManager();
    for (const deviceId of deviceIds) {
      await sessionManager.startSession(deviceId);
      const session = await waitForSession();
      if (!session) continue;
      await session.client.loadMedia({
        mediaInfo: {
          contentUrl: url,
          contentType,
          streamType: MediaStreamType.BUFFERED,
        },
        autoplay: true,
      });
    }
  }

  async setVolume(deviceId: string, percent: number): Promise<void> {
    const session = await CastContext.getSessionManager().getCurrentCastSession();
    if (session) await session.setVolume(percent / 100);
  }

  async stop(deviceId: string): Promise<void> {
    const session = await CastContext.getSessionManager().getCurrentCastSession();
    if (session) await session.client.stop();
  }
}

async function waitForSession() {
  const sessionManager = CastContext.getSessionManager();
  for (let i = 0; i < 40; i++) {
    const session = await sessionManager.getCurrentCastSession();
    if (session) return session;
    await new Promise((r) => setTimeout(r, 250));
  }
  return null;
}

export { GoogleCast };
