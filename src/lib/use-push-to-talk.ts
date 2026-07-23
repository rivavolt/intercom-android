import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
} from 'expo-audio';
import { useCallback, useRef, useState } from 'react';

import { playRecordStart, playRecordStop } from '@/lib/earcons';
import { LiveStreamSession } from '@/lib/live-stream';
import { useTransport } from '@/lib/transport-context';
import { CastdTransport } from '@/lib/transports/castd';

const CLIP_CONTENT_TYPE = 'audio/mp4';

export type PttPhase = 'idle' | 'recording' | 'sending' | 'error';

/**
 * Hold-to-talk: record while held, send on release via the active transport. When castd
 * is active and its app_warm mode is on, audio goes over the live-stream path (chunked
 * upload while recording) instead of a spooled clip after release.
 */
export function usePushToTalk(deviceIds: string[]) {
  const { transport } = useTransport();
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [phase, setPhase] = useState<PttPhase>('idle');
  const live = useRef<LiveStreamSession | null>(null);

  const start = useCallback(async () => {
    if (deviceIds.length === 0) return;
    try {
      const { granted } = await requestRecordingPermissionsAsync();
      if (!granted) {
        setPhase('error');
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });

      live.current = null;
      if (transport instanceof CastdTransport) {
        try {
          const { app_warm } = await transport.client.mode();
          if (app_warm) {
            const session = new LiveStreamSession(transport.client);
            await session.start(deviceIds, CLIP_CONTENT_TYPE);
            live.current = session;
          }
        } catch {
          // Fall back to the spooled-clip path if the live stream cannot be set up.
          live.current = null;
        }
      }

      playRecordStart();
      await recorder.prepareToRecordAsync();
      recorder.record();
      if (live.current && recorder.uri) live.current.attachFile(recorder.uri);
      setPhase('recording');
    } catch {
      setPhase('error');
    }
  }, [deviceIds, recorder, transport]);

  const stop = useCallback(async () => {
    if (phase !== 'recording') return;
    playRecordStop();
    setPhase('sending');
    try {
      await recorder.stop();
      const uri = recorder.uri;
      if (live.current) {
        if (uri) await live.current.finish(uri);
        live.current = null;
      } else if (uri) {
        await transport.sendClip(deviceIds, uri, CLIP_CONTENT_TYPE);
      }
      setPhase('idle');
    } catch {
      setPhase('error');
    } finally {
      await setAudioModeAsync({ allowsRecording: false }).catch(() => {});
    }
  }, [deviceIds, phase, recorder, transport]);

  return { phase, start, stop };
}
