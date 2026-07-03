import { requireNativeModule, type EventSubscription } from "expo-modules-core";

// Native real-time PCM audio: 16kHz mic input (base64 chunks) + 24kHz streamed playback.
// The native module declares Events("onAudioInput"), so it behaves as an EventEmitter.
const Native = requireNativeModule("TilluAudio") as {
  startRecording(): void;
  stopRecording(): void;
  playChunk(base64: string): void;
  stopPlayback(): void;
  addListener(event: string, listener: (payload: { base64: string }) => void): EventSubscription;
};

export function startRecording(): void { Native.startRecording(); }
export function stopRecording(): void { Native.stopRecording(); }
export function playChunk(base64: string): void { Native.playChunk(base64); }
export function stopPlayback(): void { Native.stopPlayback(); }
export function onAudioInput(cb: (data: { base64: string }) => void): EventSubscription {
  return Native.addListener("onAudioInput", cb);
}
