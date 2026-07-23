import type { CastdDeviceWire, CastdEvent } from '@/lib/types';

/** Thin typed client over castd's REST/WS API. */
export class CastdClient {
  constructor(readonly baseUrl: string) {}

  private async request<T>(path: string, init?: RequestInit, timeoutMs?: number): Promise<T> {
    const controller = timeoutMs ? new AbortController() : undefined;
    const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;
    try {
      const res = await fetch(`${this.baseUrl}${path}`, { ...init, signal: controller?.signal });
      if (!res.ok) throw new Error(`castd ${path}: HTTP ${res.status} ${await res.text()}`);
      return (await res.json()) as T;
    } finally {
      if (timer) clearTimeout(timer);
    }
  }

  private post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  devices(timeoutMs?: number): Promise<{ devices: CastdDeviceWire[] }> {
    return this.request('/devices', undefined, timeoutMs);
  }

  cast(device: string, url: string, contentType: string): Promise<{ ok: boolean }> {
    return this.post('/cast', { device, url, content_type: contentType });
  }

  /** Upload a clip body for castd to spool and cast in one call. */
  castFile(device: string, body: Uint8Array, contentType: string): Promise<{ ok: boolean; url: string }> {
    return this.request(`/cast-file/${encodeURIComponent(device)}?content_type=${encodeURIComponent(contentType)}`, {
      method: 'POST',
      headers: { 'Content-Type': contentType },
      body: body as unknown as BodyInit,
    });
  }

  volume(device: string, percent: number): Promise<{ ok: boolean; level: number }> {
    return this.post('/volume', { device, percent });
  }

  stop(device: string): Promise<{ ok: boolean }> {
    return this.post('/stop', { device });
  }

  mode(): Promise<{ app_warm: boolean }> {
    return this.request('/mode');
  }

  setMode(appWarm: boolean): Promise<{ app_warm: boolean }> {
    return this.request('/mode', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ app_warm: appWarm }),
    });
  }

  warm(): Promise<{ ok: boolean }> {
    return this.post('/warm', {});
  }

  createStream(contentType: string): Promise<{ id: string; url: string; ingest: string }> {
    return this.post('/streams', { content_type: contentType });
  }

  closeStream(id: string): Promise<{ ok: boolean }> {
    return this.request(`/streams/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  wsUrl(path: string): string {
    return this.baseUrl.replace(/^http/, 'ws') + path;
  }

  /** Subscribe to castd's event fan-out. Returns an unsubscribe function. */
  events(onEvent: (event: CastdEvent) => void, onClose?: () => void): () => void {
    const ws = new WebSocket(this.wsUrl('/events'));
    ws.onmessage = (msg) => {
      try {
        onEvent(JSON.parse(msg.data as string) as CastdEvent);
      } catch {
        // Non-JSON frames are ignored.
      }
    };
    ws.onclose = () => onClose?.();
    ws.onerror = () => ws.close();
    return () => ws.close();
  }
}
