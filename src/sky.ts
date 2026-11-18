import { random } from './model'

/** A low-resolution painted sky gives the 3D toys a softly pixelated backdrop. */
export function paintSky(canvas: HTMLCanvasElement, flying: boolean) {
  const aspect = window.innerWidth / window.innerHeight
  const w = Math.min(1152, Math.round(window.innerWidth))
  const h = Math.round(w / aspect)
  canvas.width = w
  canvas.height = h
  const c = canvas.getContext('2d')!
  const rand = random(241224)
  const portrait = aspect < 0.85
  const horizon = flying ? 0.3 : portrait ? 0.7 : 0.61
  const gradient = c.createLinearGradient(0, 0, 0, h * (flying ? 0.82 : horizon * 1.15))
  gradient.addColorStop(0, '#080f28')
  gradient.addColorStop(flying ? 0.22 : 0.45, '#132944')
  gradient.addColorStop(flying ? 0.66 : 0.83, '#355776')
  gradient.addColorStop(1, '#63849b')
  c.fillStyle = gradient
  c.fillRect(0, 0, w, h)

  // Each auroral curtain consists of narrow vertical rays with a brighter hem.
  c.globalCompositeOperation = 'screen'
  const curtains = [
    { y: 0.26, amp: 0.067, phase: 0.2, length: 0.15, rgb: '56,214,175', power: 0.57 },
    { y: 0.29, amp: 0.058, phase: 0.41, length: 0.12, rgb: '66,179,184', power: 0.31 },
    { y: 0.22, amp: 0.1, phase: 1.9, length: 0.12, rgb: '119,103,202', power: 0.2 },
  ]
  for (const band of curtains) {
    for (let x = 0; x < w; x += 2) {
      const u = x / w
      const flow = Math.sin(u * 6.3 + band.phase) + 0.48 * Math.sin(u * 14 - 0.8 + band.phase)
      const y = h * ((portrait ? 0.09 : 0) + band.y + flow * band.amp) * (flying ? 0.62 : 1)
      const length = h * band.length * (0.75 + 0.27 * Math.sin(u * 39 + 1) + 0.12 * rand())
      const power =
        band.power * 0.62 * (0.82 + 0.18 * Math.sin(x * 0.21)) * (0.55 + 0.45 * Math.sin(u * 4) ** 2)
      const g = c.createLinearGradient(0, y - length, 0, y + length * 0.4)
      g.addColorStop(0, 'transparent')
      g.addColorStop(0.49, `rgba(${band.rgb},${power * 0.37})`)
      g.addColorStop(0.7, `rgba(${band.rgb},${power})`)
      g.addColorStop(0.78, `rgba(${band.rgb},${power * 0.65})`)
      g.addColorStop(1, 'transparent')
      c.fillStyle = g
      c.fillRect(x, y - length, 2, length * 1.4 + 1)
    }
  }
  c.globalCompositeOperation = 'source-over'
  for (let i = 0; i < Math.floor((w * h) / 1450); i++) {
    const x = Math.floor(rand() * w)
    const y = Math.floor(rand() * h * horizon)
    const v = rand()
    const size = v > 0.9 ? 2 : 1
    c.fillStyle = `rgba(213,231,244,${0.25 + rand() * 0.6})`
    c.fillRect(x, y, size, size)
    if (v > 0.972) {
      c.fillStyle = '#c2e4e5'
      c.fillRect(x - 2, y, 6, 1)
      c.fillRect(x, y - 2, 1, 6)
    }
  }

  const mx = Math.floor(w * (portrait ? 0.81 : 0.825))
  const my = Math.floor(h * (flying ? 0.09 : portrait ? 0.158 : 0.197))
  const radius = Math.round(Math.min(w * (portrait ? 0.058 : 0.03), h * 0.058))
  const halo = c.createRadialGradient(mx, my, radius * 0.6, mx, my, radius * 2.8)
  halo.addColorStop(0, '#f1dab72d')
  halo.addColorStop(0.52, '#e9cca014')
  halo.addColorStop(1, '#f4d8b700')
  c.fillStyle = halo
  c.fillRect(mx - radius * 3, my - radius * 3, radius * 6, radius * 6)
  const grid = Math.max(1, Math.round(radius / 15))
  const craters = [
    [-0.39, -0.42, 0.15],
    [-0.53, 0.13, 0.24],
    [0.19, 0.36, 0.17],
    [0.46, -0.37, 0.11],
    [-0.23, 0.55, 0.1],
  ]
  for (let yy = -radius; yy < radius; yy += grid)
    for (let xx = -radius; xx < radius; xx += grid) {
      const u = xx / radius,
        v = yy / radius
      if (u * u + v * v > 1) continue
      const crater = craters.some(([x, y, r]) => (x - u) ** 2 + (y - v) ** 2 < r * r)
      c.fillStyle = (u + 0.27) ** 2 + (v + 0.17) ** 2 > 1.04 ? '#dbd8b6' : crater ? '#e8e3be' : '#fff2ce'
      c.fillRect(mx + xx, my + yy, grid, grid)
    }
  if (flying) return

  function poly(coords: number[][], color: string) {
    c.fillStyle = color
    c.beginPath()
    coords.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)))
    c.closePath()
    c.fill()
  }
  const ridgeBase = h * (horizon + 0.04)
  for (let i = -2; i <= 12; i++) {
    const width = w * (0.15 + rand() * 0.12)
    const peak = (w * i) / 10 + rand() * w * 0.035
    const y = h * (horizon - 0.07 - rand() * (flying ? 0.055 : 0.094))
    const drop = ridgeBase - y
    const left = peak - width * 0.56,
      right = peak + width * 0.56
    poly(
      [
        [left, ridgeBase],
        [peak - width * 0.13, y + drop * 0.21],
        [peak, y],
        [peak + width * 0.19, y + drop * 0.26],
        [right, ridgeBase],
      ],
      '#536b8a',
    )
    poly(
      [
        [peak, y],
        [peak + width * 0.19, y + drop * 0.26],
        [right, ridgeBase],
        [peak - width * 0.04, ridgeBase],
        [peak + width * 0.08, y + drop * 0.41],
      ],
      '#374e70',
    )
    poly(
      [
        [peak - width * 0.24, y + drop * 0.45],
        [peak - width * 0.13, y + drop * 0.21],
        [peak, y],
        [peak + width * 0.09, y + drop * 0.13],
        [peak + width * 0.15, y + drop * 0.31],
        [peak + width * 0.055, y + drop * 0.22],
        [peak + width * 0.04, y + drop * 0.32],
        [peak - width * 0.017, y + drop * 0.2],
        [peak - width * 0.11, y + drop * 0.35],
        [peak - width * 0.092, y + drop * 0.26],
      ],
      '#a5b4c8',
    )
  }
  for (let layer = 0; layer < 3; layer++) {
    const ridge: number[][] = [[-8, h]]
    const yBase = h * (horizon - 0.01 + layer * 0.038)
    const color = ['#435c79', '#304b69', '#25435e'][layer]
    for (let x = -4; x <= w + 6; x += 4) {
      const y = yBase + Math.sin((x / w) * 14 + layer * 1.2) * h * 0.024 + Math.cos((x / w) * 27) * h * 0.009
      ridge.push([x, y - rand() * h * 0.016])
    }
    ridge.push([w + 8, h])
    poly(ridge, color)
  }
}
