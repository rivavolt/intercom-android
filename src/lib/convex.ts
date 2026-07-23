// Convex control plane — dependency wired, client stubbed. When the control plane lands
// this becomes a ConvexReactClient created from an EXPO_PUBLIC_CONVEX_URL env and the app
// root gains a ConvexProvider; nothing else in the app should import convex directly.
import type { ConvexReactClient } from 'convex/react';

export function getConvexClient(): ConvexReactClient | null {
  return null;
}
