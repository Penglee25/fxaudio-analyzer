// src/audio/AudioEngine.ts
// Typed AudioEngine with wet/dry reverb mix.
// Exported as both a class and a default singleton instance so imports like:
// import AudioEngine, { AudioEngine as AudioEngineClass } from './audio/AudioEngine'
// continue to work.

export type Preset = {
  name: string
  preamp?: number
  panner?: number
  eq?: number[]
  reverbMix?: number
}

export class AudioEngine {
  ctx: AudioContext | null = null
  source: MediaElementAudioSourceNode | null = null
  analyser: AnalyserNode | null = null
  gainNode: GainNode | null = null
  eqNodes: BiquadFilterNode[] = []
  panner: StereoPannerNode | null = null
  convolver: ConvolverNode | null = null
  compressor: DynamicsCompressorNode | null = null

  // wet/dry nodes
  wetGain: GainNode | null = null
  dryGain: GainNode | null = null

  connectedElement: HTMLAudioElement | null = null
  bands = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
  presets: Preset[] = []
  reverbMix = 0.3 // default wet ratio

  constructor() {}

  async init(): Promise<AudioEngine> {
    if (this.ctx) return this
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()

    // nodes
    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.value = 1.0

    this.panner = this.ctx.createStereoPanner()
    this.convolver = this.ctx.createConvolver()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = 2048
    this.compressor = this.ctx.createDynamicsCompressor()

    // create wet/dry gain nodes and set default mix
    this.wetGain = this.ctx.createGain()
    this.dryGain = this.ctx.createGain()
    this.setReverbMix(this.reverbMix)

    // build EQ nodes (10-band peaking filters)
    this.eqNodes = this.bands.map((f, i) => {
      const b = this.ctx!.createBiquadFilter()
      b.type = 'peaking'
      b.frequency.value = f
      b.Q.value = 1.0 + i * 0.3
      b.gain.value = 0
      return b
    })

    // create a basic impulse response for the convolver
    this._createImpulseResponse(2.0, 2.0)
    return this
  }

  async resume(): Promise<void> {
    if (!this.ctx) await this.init()
    if (this.ctx && this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume()
      } catch (e) {
        console.warn(e)
      }
    }
  }

  connectSourceNode(sourceNode: MediaElementAudioSourceNode | null) {
    if (!this.ctx || !sourceNode) return
    this.source = sourceNode

    try {
      this.source.disconnect()
    } catch (e) {}

    // routing:
    // source -> eq chain -> compressor -> gainNode -> split:
    //   -> dryGain -> panner
    //   -> convolver -> wetGain -> panner
    // panner -> analyser -> destination

    let node: AudioNode = this.source
    this.eqNodes.forEach((n) => {
      node.connect(n)
      node = n
    })

    node.connect(this.compressor!)
    this.compressor!.connect(this.gainNode!)

    // dry path
    this.gainNode!.connect(this.dryGain!)
    // wet path: feed convolver
    this.gainNode!.connect(this.convolver!)

    // convolver -> wetGain
    this.convolver!.connect(this.wetGain!)

    // both wet and dry -> panner
    this.wetGain!.connect(this.panner!)
    this.dryGain!.connect(this.panner!)

    // panner -> analyser -> destination
    this.panner!.connect(this.analyser!)
    this.analyser!.connect(this.ctx.destination)
  }

  connectToElement(audioEl: HTMLAudioElement) {
    if (!this.ctx) this.init()
    if (this.connectedElement === audioEl) return
    this.connectedElement = audioEl
    // createMediaElementSource must be called only once per element
    const src = this.ctx!.createMediaElementSource(audioEl)
    this.connectSourceNode(src)
  }

  setPreampGain(dbGain: number) {
    const gain = Math.pow(10, dbGain / 20)
    if (this.gainNode && this.ctx) this.gainNode.gain.setValueAtTime(gain, this.ctx.currentTime)
  }

  setBandGain(index: number, db: number) {
    if (!this.eqNodes[index] || !this.ctx) return
    this.eqNodes[index].gain.setValueAtTime(db, this.ctx.currentTime)
  }

  setPanner(value: number) {
    if (!this.panner || !this.ctx) return
    this.panner.pan.setValueAtTime(value, this.ctx.currentTime)
  }

  setReverbMix(mix: number) {
    // mix in [0,1] where 0 = all dry, 1 = all wet
    this.reverbMix = Math.max(0, Math.min(1, mix))
    if (!this.wetGain || !this.dryGain) return
    if (!this.ctx) return
    this.wetGain.gain.setValueAtTime(this.reverbMix, this.ctx.currentTime)
    this.dryGain.gain.setValueAtTime(1 - this.reverbMix, this.ctx.currentTime)
  }

  getFrequencies(): number[] {
    return this.bands
  }

  getAnalyserData(): Uint8Array | null {
    if (!this.analyser) return null
    const bufferLength = this.analyser.frequencyBinCount
    const data = new Uint8Array(bufferLength)
    this.analyser.getByteFrequencyData(data)
    return data
  }

  _createImpulseResponse(durationSeconds = 2, decay = 2) {
    if (!this.ctx || !this.convolver) return
    const rate = this.ctx.sampleRate
    const length = rate * durationSeconds
    const impulse = this.ctx.createBuffer(2, length, rate)
    for (let ch = 0; ch < 2; ch++) {
      const channelData = impulse.getChannelData(ch)
      for (let i = 0; i < length; i++) {
        channelData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
      }
    }
    this.convolver.buffer = impulse
  }

  applyPreset(preset: Preset) {
    if (!preset) return
    if (preset.preamp !== undefined) this.setPreampGain(preset.preamp)
    if (preset.panner !== undefined) this.setPanner(preset.panner)
    if (preset.reverbMix !== undefined) this.setReverbMix(preset.reverbMix)
    if (preset.eq && Array.isArray(preset.eq)) {
      preset.eq.forEach((db, i) => this.setBandGain(i, db))
    }
  }
}

export default new AudioEngine()