import { File, FileMode, type FileHandle } from 'expo-file-system';

import type { CastdClient } from '@/lib/castd/client';

const CHUNK_POLL_MS = 250;

/**
 * castd live-stream path used when mode.app_warm is on: the speaker starts pulling
 * /stream/{id} while we push mic audio to the ingest WebSocket as it is written, instead
 * of waiting for the full clip.
 *
 * The chunk source is the recorder's growing output file, tailed via a FileHandle. Note
 * the container caveat: Android's MediaRecorder writes MP4/M4A whose moov atom lands at
 * finalize, so a receiver may only start decoding once the recording is stopped and the
 * tail flushed — the transport is still chunked end-to-end, and a future
 * streaming-friendly recorder (raw PCM/ADTS native module) slots in behind this same
 * interface without touching callers.
 */
export class LiveStreamSession {
  private ws?: WebSocket;
  private handle?: FileHandle;
  private timer?: ReturnType<typeof setInterval>;
  private streamId?: string;
  private sent = 0;
  private opened: Promise<void> = Promise.resolve();

  constructor(private client: CastdClient) {}

  /** Create the stream and start the speakers pulling it. Call before recording starts. */
  async start(deviceIds: string[], contentType: string): Promise<void> {
    const { id, url, ingest } = await this.client.createStream(contentType);
    this.streamId = id;
    const ws = new WebSocket(this.client.wsUrl(ingest));
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    this.opened = new Promise((resolve, reject) => {
      ws.onopen = () => resolve();
      ws.onerror = () => reject(new Error('stream ingest websocket failed'));
    });
    await this.opened;
    await Promise.all(deviceIds.map((d) => this.client.cast(d, url, contentType)));
  }

  /** Begin tailing the growing recording file, pushing new bytes as binary WS frames. */
  attachFile(fileUri: string): void {
    const file = new File(fileUri);
    this.timer = setInterval(() => {
      try {
        if (!this.handle) {
          if (!file.exists) return;
          this.handle = file.open(FileMode.ReadOnly);
        }
        this.pump(file);
      } catch {
        // The file may not be openable until the recorder flushes its header.
      }
    }, CHUNK_POLL_MS);
  }

  private pump(file: File): void {
    const size = file.size ?? 0;
    if (!this.handle || size <= this.sent) return;
    this.handle.offset = this.sent;
    const chunk = this.handle.readBytes(size - this.sent);
    this.sent += chunk.byteLength;
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(chunk.buffer as ArrayBuffer);
    }
  }

  /** Stop tailing, flush the final bytes, and tear the stream down. */
  async finish(fileUri: string): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    try {
      const file = new File(fileUri);
      if (!this.handle && file.exists) this.handle = file.open(FileMode.ReadOnly);
      if (this.handle) this.pump(file);
    } catch {
      // Best effort: the bulk of the audio has already been pushed.
    }
    this.handle?.close();
    this.ws?.close();
    if (this.streamId) await this.client.closeStream(this.streamId).catch(() => {});
  }
}
