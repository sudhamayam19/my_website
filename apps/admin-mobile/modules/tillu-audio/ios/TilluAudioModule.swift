import ExpoModulesCore
import AVFoundation

// Real-time voice: 16kHz PCM16 mic capture → JS; 24kHz PCM16 chunks from JS → speaker.
public class TilluAudioModule: Module {
  private let engine = AVAudioEngine()
  private let player = AVAudioPlayerNode()
  private var playFormat: AVAudioFormat?
  private var recording = false
  private var converterToOut: AVAudioConverter?

  public func definition() -> ModuleDefinition {
    Name("TilluAudio")
    Events("onAudioInput")

    Function("startRecording") { self.startRecording() }
    Function("stopRecording") { self.stopRecording() }
    Function("playChunk") { (base64: String) in self.playChunk(base64) }
    Function("stopPlayback") { self.stopPlayback() }

    OnDestroy {
      self.stopRecording()
      self.stopPlayback()
    }
  }

  private func configureSession() {
    let session = AVAudioSession.sharedInstance()
    try? session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
    try? session.setActive(true)
  }

  private func startRecording() {
    if recording { return }
    configureSession()

    // Playback graph @ 24kHz
    let outFmt = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 24000, channels: 1, interleaved: true)!
    playFormat = outFmt
    engine.attach(player)
    engine.connect(player, to: engine.mainMixerNode, format: nil)

    // Mic tap → 16kHz PCM16, emit base64
    let input = engine.inputNode
    let inFmt = input.outputFormat(forBus: 0)
    let target = AVAudioFormat(commonFormat: .pcmFormatInt16, sampleRate: 16000, channels: 1, interleaved: true)!
    let conv = AVAudioConverter(from: inFmt, to: target)

    input.installTap(onBus: 0, bufferSize: 2048, format: inFmt) { [weak self] buffer, _ in
      guard let self = self, let conv = conv else { return }
      let ratio = 16000.0 / inFmt.sampleRate
      let outCap = AVAudioFrameCount(Double(buffer.frameLength) * ratio + 16)
      guard let outBuf = AVAudioPCMBuffer(pcmFormat: target, frameCapacity: outCap) else { return }
      var err: NSError?
      var fed = false
      conv.convert(to: outBuf, error: &err) { _, status in
        if fed { status.pointee = .noDataNow; return nil }
        fed = true; status.pointee = .haveData; return buffer
      }
      if let ch = outBuf.int16ChannelData, outBuf.frameLength > 0 {
        let data = Data(bytes: ch[0], count: Int(outBuf.frameLength) * 2)
        self.sendEvent("onAudioInput", ["base64": data.base64EncodedString()])
      }
    }

    do { try engine.start(); player.play(); recording = true } catch { }
  }

  private func stopRecording() {
    recording = false
    engine.inputNode.removeTap(onBus: 0)
    engine.stop()
  }

  private func playChunk(_ base64: String) {
    guard let data = Data(base64Encoded: base64), let fmt = playFormat else { return }
    let frames = AVAudioFrameCount(data.count / 2)
    guard frames > 0, let buf = AVAudioPCMBuffer(pcmFormat: fmt, frameCapacity: frames) else { return }
    buf.frameLength = frames
    data.withUnsafeBytes { raw in
      if let src = raw.baseAddress, let dst = buf.int16ChannelData {
        memcpy(dst[0], src, data.count)
      }
    }
    player.scheduleBuffer(buf, completionHandler: nil)
    if !player.isPlaying { player.play() }
  }

  private func stopPlayback() {
    player.stop()
    player.play()
  }
}
