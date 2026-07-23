import type { LucideIcon } from 'lucide-react-native';
import { Cast, MonitorSpeaker, Speaker, Tv } from 'lucide-react-native';

/** Map a Cast model string to a device-type icon. */
export function iconForModel(model: string): LucideIcon {
  const m = model.toLowerCase();
  if (m.includes('hub') || m.includes('display')) return MonitorSpeaker;
  if (m.includes('tv') || m.includes('shield') || m.includes('chromecast')) return Tv;
  if (m.includes('group')) return Cast;
  return Speaker;
}
