#!/usr/bin/env node
// Generates the PTT earcon WAV assets. Frequencies are shared across the CLI and web
// intercom clients and must stay exactly these: record-start = 660→990 Hz, record-stop =
// 660→440 Hz, each a 120 ms sine sweep under a sin(πt) envelope.
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'earcons');
const SAMPLE_RATE = 44100;
const DURATION = 0.12;

function sweep(f0, f1) {
  const n = Math.round(SAMPLE_RATE * DURATION);
  const samples = new Int16Array(n);
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = t / DURATION;
    // Linear-in-time frequency sweep: integrate f(t) = f0 + (f1-f0)*t/T for phase.
    const phase = 2 * Math.PI * (f0 * t + ((f1 - f0) * t * t) / (2 * DURATION));
    const envelope = Math.sin(Math.PI * progress);
    samples[i] = Math.round(Math.sin(phase) * envelope * 0.8 * 32767);
  }
  return samples;
}

function wav(samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  Buffer.from(samples.buffer).copy(buf, 44);
  return buf;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(join(OUT_DIR, 'record-start.wav'), wav(sweep(660, 990)));
writeFileSync(join(OUT_DIR, 'record-stop.wav'), wav(sweep(660, 440)));
console.log(`earcons written to ${OUT_DIR}`);
