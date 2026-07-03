Pod::Spec.new do |s|
  s.name           = 'TilluAudio'
  s.version        = '0.1.0'
  s.summary        = 'Real-time PCM audio for Tillu live calls'
  s.description    = 'Captures 16kHz mic PCM and plays streamed 24kHz PCM for Gemini Live.'
  s.author         = ''
  s.homepage       = 'https://sudhamayam.vercel.app'
  s.platforms      = { :ios => '15.1' }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
