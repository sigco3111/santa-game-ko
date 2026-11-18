type Note = [number, number, number]

export class SleighBells {
  enabled: boolean
  private ctx?: AudioContext
  private lastLock = 0
  constructor(enabled: boolean) {
    this.enabled = enabled
  }
  unlock() {
    if (!this.enabled) return
    try {
      this.ctx ??= new AudioContext()
      if (this.ctx.state === 'suspended') void this.ctx.resume().catch(() => {})
    } catch {
      /* Silent play on devices without an audio output. */
    }
  }
  private play(notes: Note[], wave: OscillatorType = 'sine', volume = 0.055) {
    if (!this.enabled || !this.ctx || this.ctx.state !== 'running') return
    for (const [frequency, delay, duration] of notes) {
      const osc = this.ctx.createOscillator(),
        env = this.ctx.createGain(),
        t = this.ctx.currentTime + delay
      osc.type = wave
      osc.frequency.setValueAtTime(frequency, t)
      env.gain.setValueAtTime(0.0001, t)
      env.gain.exponentialRampToValueAtTime(volume, t + 0.009)
      env.gain.exponentialRampToValueAtTime(0.0001, t + duration)
      osc.connect(env).connect(this.ctx.destination)
      osc.onended = () => {
        osc.disconnect()
        env.disconnect()
      }
      osc.start(t)
      osc.stop(t + duration + 0.01)
    }
  }
  start() {
    this.play(
      [
        [523.25, 0, 0.18],
        [659.25, 0.1, 0.25],
        [783.99, 0.2, 0.27],
        [1046.5, 0.32, 0.42],
      ],
      'triangle',
    )
  }
  drop() {
    this.play(
      [
        [650, 0, 0.085],
        [440, 0.045, 0.1],
      ],
      'sine',
      0.038,
    )
  }
  lock() {
    if (performance.now() - this.lastLock < 600) return
    this.lastLock = performance.now()
    this.play([[1174.66, 0, 0.115]], 'sine', 0.022)
  }
  hit(combo: number) {
    const pitches = [659.25, 783.99, 880, 987.77, 1046.5],
      n = pitches[Math.min(combo, 5) - 1]
    this.play(
      [
        [n, 0, 0.26],
        [n * 1.25, 0.07, 0.28],
        [n * 1.5, 0.14, 0.36],
        [n * 3, 0.14, 0.16],
      ],
      'sine',
      0.064,
    )
  }
  miss() {
    this.play(
      [
        [220, 0, 0.12],
        [174.6, 0.08, 0.15],
      ],
      'triangle',
      0.041,
    )
  }
  tick() {
    this.play([[880, 0, 0.09]], 'sine', 0.034)
  }
  finish() {
    this.play(
      [
        [784, 0, 0.22],
        [659, 0.14, 0.25],
        [698.46, 0.29, 0.24],
        [784, 0.44, 0.27],
        [1046.5, 0.64, 0.65],
      ],
      'triangle',
      0.051,
    )
  }
}
