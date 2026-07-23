# intercom-android

Android intercom for Google Home / Cast speakers: hold-to-talk from a device grid, a broadcast button, and per-speaker home-screen widget tiles.

## Transports

Everything speaker-facing goes through a `CastTransport` interface (`src/lib/types.ts`) with two implementations:

- **`CastdTransport`** (primary): the [castd](https://github.com/rivavolt/castd) daemon over the tailnet (default `http://riva:8811`, configurable in settings). Clips upload via `POST /cast-file/{device}`; a broadcast spools once and fans out with `POST /cast`. When castd's `mode.app_warm` is on, recording goes over the live-stream path instead: `POST /streams` → binary chunks to the ingest WebSocket while the mic is held, speakers pull `/stream/{id}`.
- **`DirectCastTransport`** (serverless fallback): device discovery and sessions via the native Google Cast sender SDK (`react-native-google-cast`, requires Google Play services). Recorded clips are served from an embedded HTTP server (`@dr.pogodin/react-native-static-server`) bound to the phone's WLAN IP; the speaker pulls the file over the LAN — no server anywhere. The Play Services sender holds one session at a time, so broadcast in direct mode is sequential per speaker.

Selection: on app focus, castd's `/devices` is probed with a 1.5 s timeout — reachable castd wins, otherwise direct. The active transport is surfaced in the UI and can be overridden in settings.

## Earcons

`scripts/gen-earcons.mjs` generates the WAV assets (checked in under `assets/earcons/`): record-start = 660→990 Hz, record-stop = 660→440 Hz, 120 ms sine sweeps under a sin(πt) envelope — frequencies shared with the CLI/web intercom clients.

## Widget

`react-native-android-widget` renders per-speaker quick-send tiles from the last-known device list persisted in AsyncStorage (so it works offline/headless). Tapping a tile deep-links to `intercom://ptt/<device>`.

## Development

Expo with CNG (`android/` is generated, not committed); native modules mean expo-dev-client, not Expo Go.

```sh
bun install
bun run typecheck        # tsc --noEmit
bun run earcons          # regenerate assets/earcons
npx expo prebuild --platform android
```

Building the APK needs an x86_64 host (aapt2 has no aarch64 build on Asahi) — on the fleet that's volt:

```sh
nix develop              # Android SDK 36, NDK 27.1, JDK 17
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

The Convex client dependency is present but stubbed (`src/lib/convex.ts`); the control plane lands later.
