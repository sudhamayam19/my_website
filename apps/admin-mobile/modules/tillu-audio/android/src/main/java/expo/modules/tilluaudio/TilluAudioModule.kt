package expo.modules.tilluaudio

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioManager
import android.media.AudioRecord
import android.media.AudioTrack
import android.media.MediaRecorder
import android.media.audiofx.AcousticEchoCanceler
import android.media.audiofx.NoiseSuppressor
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.util.concurrent.Executors
import kotlin.concurrent.thread

// Real-time voice: 16kHz PCM16 mic capture → JS; 24kHz PCM16 chunks from JS → speaker.
class TilluAudioModule : Module() {
  private val IN_RATE = 16000
  private val OUT_RATE = 24000

  private var recorder: AudioRecord? = null
  private var recording = false
  private var recThread: Thread? = null

  private var track: AudioTrack? = null
  private val playExecutor = Executors.newSingleThreadExecutor()

  override fun definition() = ModuleDefinition {
    Name("TilluAudio")
    Events("onAudioInput")

    Function("startRecording") { startRecording() }
    Function("stopRecording") { stopRecording() }
    Function("playChunk") { base64: String -> playChunk(base64) }
    Function("stopPlayback") { stopPlayback() }

    OnDestroy {
      stopRecording()
      stopPlayback()
      releaseTrack()
    }
  }

  // ── Mic capture ──
  private fun startRecording() {
    if (recording) return
    val minBuf = AudioRecord.getMinBufferSize(IN_RATE, AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT)
    val bufSize = maxOf(minBuf, 2048) * 2
    val rec = AudioRecord(
      MediaRecorder.AudioSource.VOICE_COMMUNICATION,
      IN_RATE,
      AudioFormat.CHANNEL_IN_MONO,
      AudioFormat.ENCODING_PCM_16BIT,
      bufSize
    )
    try {
      if (AcousticEchoCanceler.isAvailable()) AcousticEchoCanceler.create(rec.audioSessionId)?.enabled = true
      if (NoiseSuppressor.isAvailable()) NoiseSuppressor.create(rec.audioSessionId)?.enabled = true
    } catch (_: Throwable) { /* effects optional */ }

    recorder = rec
    recording = true
    rec.startRecording()

    recThread = thread(start = true) {
      val buf = ByteArray(2048)
      while (recording) {
        val n = rec.read(buf, 0, buf.size)
        if (n > 0) {
          val chunk = if (n == buf.size) buf else buf.copyOf(n)
          val b64 = Base64.encodeToString(chunk, Base64.NO_WRAP)
          sendEvent("onAudioInput", mapOf("base64" to b64))
        }
      }
    }
  }

  private fun stopRecording() {
    recording = false
    try { recThread?.join(300) } catch (_: Throwable) {}
    recThread = null
    try { recorder?.stop() } catch (_: Throwable) {}
    try { recorder?.release() } catch (_: Throwable) {}
    recorder = null
  }

  // ── Streamed playback ──
  private fun ensureTrack(): AudioTrack {
    track?.let { return it }
    val minBuf = AudioTrack.getMinBufferSize(OUT_RATE, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)
    val t = AudioTrack.Builder()
      .setAudioAttributes(
        AudioAttributes.Builder()
          .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
          .build()
      )
      .setAudioFormat(
        AudioFormat.Builder()
          .setSampleRate(OUT_RATE)
          .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
          .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
          .build()
      )
      .setBufferSizeInBytes(maxOf(minBuf, 4096) * 4)
      .setTransferMode(AudioTrack.MODE_STREAM)
      .build()
    t.play()
    track = t
    return t
  }

  private fun playChunk(base64: String) {
    val bytes = try { Base64.decode(base64, Base64.NO_WRAP) } catch (_: Throwable) { return }
    playExecutor.execute {
      try {
        val t = ensureTrack()
        if (t.playState != AudioTrack.PLAYSTATE_PLAYING) t.play()
        t.write(bytes, 0, bytes.size)
      } catch (_: Throwable) { /* ignore */ }
    }
  }

  private fun stopPlayback() {
    // Interruption: drop everything queued and resume fresh on next chunk
    playExecutor.execute {
      try { track?.pause(); track?.flush(); track?.play() } catch (_: Throwable) {}
    }
  }

  private fun releaseTrack() {
    try { track?.stop() } catch (_: Throwable) {}
    try { track?.release() } catch (_: Throwable) {}
    track = null
  }
}
