import * as T from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { Model, random, silhouette, type Point } from './model'
import { parcel } from './sleigh'

const houses = ['#ab4440', '#397b7a', '#b4804a', '#655f89', '#43718a', '#9d5553']
const trim = '#e8ceb1',
  timber = '#71524f',
  roof = '#44495a'
const snow = '#e1edf3',
  snowBlue = '#b9cfdf'
const gable = silhouette(
  [
    [-0.5, 0],
    [0.5, 0],
    [0, 1],
  ],
  1,
)
const roofSnow = new RoundedBoxGeometry(1, 1, 1, 1, 0.075)
const bulbs = ['#ffae66', '#ffe5a1', '#eb7e71', '#a7dfc5']

function evergreenTier() {
  const vertices: number[] = []
  const rim: Point[] = []
  for (let i = 0; i < 14; i++) {
    const a = (i * Math.PI) / 7,
      tip = i % 2 === 0
    const r = tip ? 1 : 0.76
    rim.push([Math.cos(a) * r, tip ? -0.52 + 0.06 * Math.sin(i * 3) : -0.32, Math.sin(a) * r])
  }
  for (let i = 0; i < rim.length; i++) {
    const a = rim[i],
      b = rim[(i + 1) % rim.length]
    vertices.push(0.025, 0.52, 0, ...b, ...a, 0, -0.25, 0, ...a, ...b)
  }
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3))
  g.computeVertexNormals()
  return g
}
const branches = evergreenTier()

function windowPane(m: Model, x: number, y: number, z: number, w: number, h: number, shutters = false) {
  m.box('#534452', x, y, z, w * 1.3, h * 1.22, 0.1)
  if (shutters)
    for (const s of [-1, 1]) {
      m.box('#6b4341', x + s * w * 0.77, y, z + 0.02, w * 0.26, h * 1.04, 0.076)
    }
  m.box('#ffc274', x, y, z + 0.061, w, h, 0.055, [0, 0, 0], true)
  m.box('#ffdd92', x, y + h * 0.22, z + 0.091, w * 0.93, h * 0.4, 0.009, [0, 0, 0], true)
  m.box(timber, x, y, z + 0.097, w * 0.11, h, 0.04)
  m.box(timber, x, y - 0.01, z + 0.099, w, h * 0.09, 0.04)
  m.box(snow, x, y - h * 0.63, z + 0.035, w * 1.49, 0.082, 0.2)
  m.halo('#ffac55', [x, y, z + 0.135], w * 3.2, h * 2.6, [0, 0, 0], 0.32)
}

function buildPine(lights: boolean) {
  const m = new Model()
  m.cylinder('#6d5651', 0, 0.12, 0, 0.075, 0.25, 6)
  for (let i = 0; i < 3; i++) {
    const size = [0.33, 0.265, 0.17][i],
      level = [0.34, 0.55, 0.765][i]
    const height = [0.49, 0.45, 0.46][i]
    const turn = i * 0.46
    m.geo(branches, ['#215059', '#30616b', '#3f707a'][i], [0, level, 0], [size, height, size], [0, turn, 0])
    m.geo(
      branches,
      i === 2 ? '#d3e6ec' : '#b6cedd',
      [0, level + height * 0.072, 0],
      [size * 0.91, height * 0.88, size * 0.91],
      [0, turn, 0],
    )
    if (lights)
      for (let j = 0; j < 7; j++) {
        const a = (Math.PI * 2 * j) / 7 + turn
        m.ball(
          bulbs[(i + j) % 4],
          Math.cos(a) * size * 0.9,
          level - height * 0.34 + 0.018 * Math.sin(a),
          Math.sin(a) * size * 0.9,
          0.023,
          0.027,
          0.023,
          false,
          true,
        )
      }
  }
  if (lights) {
    m.box('#ffe09a', 0, 1.045, 0, 0.078, 0.078, 0.064, [0, 0, Math.PI / 4], true)
  }
  return m.finish()
}
const pineModels = [buildPine(false), buildPine(true)]
export function pine(m: Model, x: number, z: number, h: number, angle: number, lights = false) {
  m.instance(pineModels[lights ? 1 : 0], x, z, angle, h)
}

export function lamp(m: Model, x: number, z: number, scale = 1) {
  m.at(x, 0, z, 0, scale, () => {
    m.cylinder('#455362', 0, 0.14, 0, 0.22, 0.28, 6, 0.7)
    m.cylinder('#475260', 0, 0.89, 0, 0.075, 1.44, 6)
    m.cylinder('#916c4b', 0, 1.58, 0, 0.2, 0.12, 4, 0.8, [0, Math.PI / 4, 0])
    m.box('#ffd387', 0, 1.79, 0, 0.235, 0.37, 0.235, [0, 0, 0], true)
    for (const a of [-0.129, 0.129])
      for (const b of [-0.129, 0.129]) m.box('#715643', a, 1.79, b, 0.03, 0.4, 0.03)
    m.cylinder('#637282', 0, 2.02, 0, 0.26, 0.19, 4, 0.18, [0, Math.PI / 4, 0])
    m.cylinder(snow, 0, 2.09, 0, 0.19, 0.13, 4, 0, [0, Math.PI / 4, 0])
    m.halo('#ffba65', [0, 1.78, 0.16], 1.02, 1.06, [0, 0, 0], 0.78)
    m.halo('#ffbe75', [0, 0.055, 0], 3.3, 3.3, [-Math.PI / 2, 0, 0], 0.54)
  })
}

function fence(m: Model, x: number, z: number, length: number, yaw: number) {
  m.at(x, 0, z, yaw, 1, () => {
    for (let i = 0; i <= Math.ceil(length / 1.25); i++) {
      const px = length * (i / Math.ceil(length / 1.25) - 0.5)
      m.box('#907164', px, 0.32, 0, 0.14, 0.64, 0.14)
      m.box(snow, px, 0.68, 0, 0.19, 0.09, 0.19)
    }
    m.box('#9d8172', 0, 0.38, 0, length, 0.14, 0.1)
    m.box(snowBlue, 0, 0.47, 0, length, 0.055, 0.12)
  })
}

function dimensions(variant: number) {
  return {
    w: 2.85 + (variant % 3) * 0.19,
    d: 2.88 + (variant % 2) * 0.4,
    h: 1.75 + (variant % 3) * 0.13,
    rise: 1.35 + (variant % 2) * 0.24,
  }
}

/** A house has one actual chimney mouth. Gameplay uses the very same placement. */
export function cottage(m: Model, variant: number, target = false) {
  const wall = houses[variant % houses.length],
    { w, d, h, rise } = dimensions(variant),
    peak = h + rise
  const cx = w * 0.25,
    cz = -d * 0.17,
    mouth = peak + (target ? 0.51 : 0.36)
  m.box('#778291', 0, 0.13, 0, w + 0.1, 0.27, d + 0.1)
  m.box(wall, 0, (h + 0.22) / 2, 0, w, h - 0.22, d)
  m.geo(gable, wall, [0, h - 0.012, 0], [w, rise, d])
  for (const s of [-1, 1]) {
    m.box(trim, s * (w / 2 - 0.04), h / 2, d / 2, 0.11, h, 0.11)
    m.box(trim, s * (w / 2 - 0.04), h / 2, -d / 2, 0.11, h, 0.11)
    for (let i = 0; i < 3; i++) {
      m.box('#755955', s * (w / 2 + 0.005), 0.39 + 0.46 * i, 0, 0.018, 0.028, d * 0.94)
    }
    const slope = Math.atan2(rise, w / 2),
      run = Math.hypot(w / 2, rise)
    m.box(roof, s * w * 0.258, h + rise * 0.5, 0, run + 0.43, 0.23, d + 0.53, [0, 0, -s * slope])
    m.geo(
      roofSnow,
      snow,
      [s * w * 0.263, h + rise * 0.5 + 0.15, 0],
      [run + 0.48, 0.2, d + 0.58],
      [0, 0, -s * slope],
    )
    for (let j = 0; j < 6; j++) {
      const z = (j / 5 - 0.5) * (d + 0.23)
      m.cylinder(
        '#b9d6e5',
        s * (w * 0.5 + 0.17),
        h - 0.09,
        z,
        0.051,
        0.2 + 0.12 * Math.abs(Math.sin(j * 2 + variant)),
        5,
        0,
        [0, 0, Math.PI],
      )
    }
    for (let j = 0; j < 5; j++) {
      const z = (j / 4 - 0.5) * d
      if ((j + variant) % 3 === 0) m.ball('#c8dce7', s * (w / 2 + 0.16), h + 0.015, z, 0.16, 0.11, 0.27)
    }
    m.at((s * w) / 2, 0, 0, (s * Math.PI) / 2, 1, () => {
      windowPane(m, -d * 0.236, h * 0.58, 0.01, 0.47, 0.63)
      windowPane(m, d * 0.236, h * 0.58, 0.01, 0.47, 0.63)
    })
  }
  m.box('#d4e4ec', 0, peak + 0.13, 0, 0.22, 0.14, d + 0.56)
  if (variant % 3 !== 1) {
    // A little gabled dormer on the west roof catches the moonlight.
    m.at(-w * 0.34, h + rise * 0.31, -d * 0.13, -Math.PI / 2, 1, () => {
      m.box(wall, 0, 0.22, 0, 0.76, 0.45, 0.67)
      m.geo(gable, wall, [0, 0.43, 0], [0.76, 0.37, 0.67])
      windowPane(m, 0, 0.325, 0.35, 0.33, 0.34)
      for (const s of [-1, 1]) m.box(snow, s * 0.225, 0.62, 0, 0.66, 0.13, 0.88, [0, 0, -s * 0.72])
    })
  }
  for (const f of [-1, 1])
    m.at(0, 0, (f * d) / 2, f === 1 ? 0 : Math.PI, 1, () => {
      const joint = '#' + new T.Color(wall).multiplyScalar(0.73).getHexString()
      for (let plank = 1; plank <= 6; plank++)
        m.box(joint, 0, 0.23 + plank * 0.22, 0.006, w - 0.14, 0.016, 0.021)
      windowPane(m, -w * 0.31, h * 0.58, 0.01, 0.46, 0.65, true)
      windowPane(m, w * 0.31, h * 0.58, 0.01, 0.46, 0.65, true)
      windowPane(m, 0, h + rise * 0.34, 0.01, 0.48, 0.47)
      m.box('#61454a', 0, 0.58, 0.02, 0.6, 1.17, 0.1)
      m.box('#97624d', 0, 0.54, 0.089, 0.45, 1.03, 0.045)
      if (variant % 3 === 0 || variant % 3 === 2) {
        m.box(snow, 0, 1.34, 0.26, 1.08, 0.13, 0.66, [0.16, 0, 0])
        for (const s of [-1, 1]) {
          m.box(trim, s * 0.46, 0.68, 0.46, 0.082, 1.25, 0.082)
          m.beam('#457566', [s * 0.49, 1.32, 0.53], [0, 1.23, 0.56], 0.045)
          m.ball('#e86655', s * 0.24, 1.23, 0.58, 0.051)
        }
      } else {
        m.beam(trim, [-w * 0.41, h + 0.03, 0.055], [-0.26, h + rise * 0.67, 0.055], 0.041)
        m.beam(trim, [w * 0.41, h + 0.03, 0.055], [0.26, h + rise * 0.67, 0.055], 0.041)
      }
      m.ball('#407866', 0, 0.83, 0.145, 0.133, 0.14, 0.045)
      m.ball('#e46556', 0, 0.75, 0.185, 0.051)
      m.box(snow, 0, 0.1, 0.23, 0.92, 0.14, 0.59)
      m.halo('#ffc47c', [0, 0.06, 0.73], w * 1.55, 2.5, [-Math.PI / 2, 0, 0], 0.39)
      for (let i = 0; i < 9; i++) {
        const x = (i / 8 - 0.5) * w * 1.08
        const y = peak + 0.02 - (Math.abs(x) * rise) / (w / 2)
        m.ball(bulbs[(i + variant) % 4], x, y - 0.13, 0.31, 0.061, 0.078, 0.061, false, true)
      }
    })
  const shaft = target ? 0.82 : 0.53,
    outer = shaft * 1.22,
    rim = target ? 0.14 : 0.1
  const bottom = peak - rise * 0.67
  m.box('#95554f', cx, (mouth + bottom) / 2 - 0.07, cz, shaft, mouth - bottom - 0.14, shaft)
  for (let k = 0; k < 3; k++) {
    m.box(
      '#bc8070',
      cx + (k % 2 ? -0.15 : 0.11) * shaft,
      mouth - 0.34 - k * 0.22,
      cz + shaft * 0.502,
      shaft * 0.35,
      0.066,
      0.015,
    )
  }
  m.box('#382d3c', cx, mouth - 0.12, cz, outer * 0.92, 0.045, outer * 0.92)
  for (const s of [-1, 1]) {
    m.box(target ? '#e6ae65' : snow, cx, mouth - 0.06, cz + (s * (outer - rim)) / 2, outer, 0.145, rim)
    m.box(
      target ? '#e6ae65' : snow,
      cx + (s * (outer - rim)) / 2,
      mouth - 0.06,
      cz,
      rim,
      0.145,
      outer - rim * 2,
    )
  }
  return new T.Vector3(cx, mouth, cz)
}

function church(m: Model) {
  m.at(-1.25, 0, -0.75, Math.PI / 2, 1.03, () => cottage(m, 2))
  m.box('#b99073', 0, 2.02, 0, 1.73, 4.04, 1.65)
  for (const s of [-1, 1]) {
    m.box(trim, s * 0.82, 2.05, 0.81, 0.11, 4.09, 0.12)
    windowPane(m, s * 0.35, 2.0, 0.84, 0.34, 0.9)
  }
  m.box('#73544d', 0, 3.86, 0, 1.96, 0.22, 1.89)
  m.box(snow, 0, 4.02, 0, 2.03, 0.14, 1.94)
  m.box('#ac7965', 0, 4.43, 0, 1.25, 0.9, 1.2)
  m.cylinder('#59454b', 0, 4.45, 0.62, 0.37, 0.095, 12, 1, [Math.PI / 2, 0, 0])
  m.cylinder('#ffd789', 0, 4.45, 0.68, 0.29, 0.045, 12, 1, [Math.PI / 2, 0, 0], true)
  m.box('#5e474a', 0, 4.54, 0.71, 0.035, 0.19, 0.025)
  m.box('#5e474a', 0.075, 4.45, 0.72, 0.16, 0.035, 0.025)
  m.cylinder('#547684', 0, 5.69, 0, 1.1, 1.68, 4, 0, [0, Math.PI / 4, 0])
  m.cylinder(snowBlue, 0, 6.01, 0, 0.73, 1.15, 4, 0, [0, Math.PI / 4, 0])
  m.beam('#cd9554', [0, 6.46, 0], [0, 6.91, 0], 0.043)
  m.ball('#ffda7e', 0, 6.94, 0, 0.093, 0.11, 0.093, false, true)
}

function snowman(m: Model, x: number, z: number, s: number) {
  m.at(x, 0, z, -0.35, s, () => {
    m.ball('#ccdeea', 0, 0.37, 0, 0.46, 0.42, 0.44, true)
    m.ball(snow, 0, 0.91, 0, 0.34, 0.38, 0.32, true)
    m.ball('#eaf0ed', 0, 1.38, 0, 0.285, 0.28, 0.28, true)
    m.cylinder('#ba4249', 0, 1.18, 0, 0.29, 0.11, 12)
    m.box('#c65052', 0.14, 1.01, 0.28, 0.12, 0.36, 0.085, [0, 0, 0.19])
    m.cylinder('#354657', 0, 1.62, 0, 0.34, 0.07, 12)
    m.cylinder('#394657', 0, 1.79, 0, 0.216, 0.32, 12)
    m.cylinder('#b65050', 0, 1.69, 0, 0.222, 0.068, 12)
    m.cylinder('#e69448', 0, 1.39, 0.315, 0.06, 0.23, 7, 0, [Math.PI / 2, 0, 0])
    for (const a of [-1, 1]) {
      m.ball('#393746', a * 0.095, 1.46, 0.25, 0.035)
      m.beam(timber, [a * 0.25, 0.96, 0], [a * 0.58, 1.18, 0.02], 0.043, 0.025)
      m.beam(timber, [a * 0.49, 1.11, 0.01], [a * 0.51, 1.26, 0.06], 0.026, 0.012)
    }
    for (const y of [0.8, 0.99]) m.ball('#404151', 0, y, 0.306, 0.039)
  })
}

function market(m: Model, x: number, z: number, yaw: number) {
  m.at(x, 0, z, yaw, 1, () => {
    m.box('#87534b', 0, 0.43, 0, 2.03, 0.86, 1.1)
    m.box('#ba926c', 0, 0.9, 0, 2.27, 0.11, 1.27)
    for (const side of [-1, 1])
      for (const end of [-1, 1]) m.box(trim, side * 0.97, 1.49, end * 0.47, 0.1, 1.2, 0.1)
    for (let i = 0; i < 9; i++) {
      const px = (i - 4) * 0.266,
        color = i % 2 ? '#ede0bd' : '#be4d50'
      for (const s of [-1, 1]) m.box(color, px, 2.15, s * 0.36, 0.27, 0.1, 0.83, [s * 0.22, 0, 0])
      m.box(color, px, 1.96, 0.757, 0.27, 0.2, 0.077)
      m.ball(bulbs[i % 4], px, 1.87, 0.81, 0.049, 0.06, 0.048, false, true)
    }
    for (let i = 0; i < 3; i++)
      parcel(
        m,
        (i - 1) * 0.53,
        0.96,
        0,
        0.37,
        0.28 + (i % 2) * 0.11,
        0.33,
        i % 2 ? '#b8534d' : '#398578',
        '#e8c37f',
      )
    m.box(snow, 0, 2.28, 0, 2.4, 0.12, 0.15)
  })
}

function garland(m: Model, x: number, z: number, yaw: number, length: number) {
  m.at(x, 0, z, yaw, 1, () => {
    for (const s of [-1, 1]) {
      m.cylinder('#73594d', (s * length) / 2, 1.48, 0, 0.085, 2.96, 7)
      m.ball(snow, (s * length) / 2, 3, 0, 0.115, 0.08, 0.115)
    }
    let last: Point = [-length / 2, 2.88, 0]
    for (let i = 1; i <= 12; i++) {
      const u = i / 12,
        p: Point = [(u - 0.5) * length, 2.88 - 0.48 * Math.sin(u * Math.PI), 0]
      m.beam('#3d544f', last, p, 0.024)
      m.ball(bulbs[i % 4], p[0], p[1] - 0.1, 0, 0.068, 0.09, 0.068, false, true)
      m.halo(bulbs[i % 4], [p[0], p[1] - 0.1, 0.05], 0.41, 0.41, [0, 0, 0], 0.5)
      last = p
    }
  })
}

function ground(m: Model, width: number, depth: number, z: number, seed: number) {
  const rnd = random(seed)
  const g = new T.PlaneGeometry(width, depth, Math.ceil(width / 3.0), Math.ceil(depth / 3.0)).rotateX(
    -Math.PI / 2,
  )
  const p = g.getAttribute('position')
  for (let i = 0; i < p.count; i++) {
    const inside = Math.abs(p.getZ(i)) < depth / 2 - 0.01 && Math.abs(p.getX(i)) < width / 2 - 0.01
    if (inside)
      p.setXYZ(i, p.getX(i) + (rnd() - 0.5) * 1.2, (rnd() - 0.5) * 0.24, p.getZ(i) + (rnd() - 0.5) * 1.2)
  }
  g.computeVertexNormals()
  m.geo(g, '#879fbd', [0, -0.105, z], [1, 1, 1])
  g.dispose()
}

function footprint(m: Model, x: number, z: number, a: number, b: number) {
  m.ball('#8eaec4', x, -0.006, z, a, 0.04, b)
}

function snowyLane(m: Model, points: Array<[number, number]>, width: number) {
  const v: number[] = []
  for (let i = 1; i < points.length; i++) {
    const [x, z] = points[i - 1],
      [u, w] = points[i],
      r = width / 2
    v.push(x - r, 0, z, x + r, 0, z, u + r, 0, w, x - r, 0, z, u + r, 0, w, u - r, 0, w)
  }
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(v, 3))
  g.computeVertexNormals()
  m.geo(g, '#7a91ad', [0, 0.023, 0], [1, 1, 1])
  g.dispose()
}

export function heroVillage() {
  const m = new Model(),
    rnd = random(2512)
  ground(m, 88, 54, 4.3, 514)
  const lane: Array<[number, number]> = []
  for (let z = 28; z >= -22; z -= 1) lane.push([4.5 + Math.sin(z * 0.24) * 1.65, z])
  snowyLane(m, lane, 2.5)
  const buildings = [
    [8.6, 6.1, 1.3, -0.53, 0],
    [1.1, 7.8, 1.03, 0.42, 1],
    [15.2, 3.2, 1.18, 0.4, 2],
    [2.9, -1.2, 0.89, -0.48, 2],
    [8.0, -3.0, 0.88, 0.49, 1],
    [12.0, -6.0, 0.78, -0.5, 0],
    [-4.6, 2.1, 1.12, -0.49, 0],
    [-10.4, 5.7, 1.03, 0.34, 2],
    [-14.0, -1.9, 0.95, -0.41, 3],
    [-2.8, -7.2, 0.91, 0.37, 1],
    [-8.6, -5.5, 0.85, -0.56, 5],
    [18.1, -6.5, 0.88, 0.59, 3],
    [0.6, -13.0, 0.6, -0.33, 0],
    [6.1, -13.8, 0.63, 0.53, 2],
    [-6.1, -15.0, 0.66, -0.51, 2],
    [-19.1, 5.9, 1.27, 0.39, 1],
    [22, 7.4, 1.23, -0.52, 0],
  ]
  const smoke: T.Vector3[] = []
  for (const [x, z, s, yaw, v] of buildings) {
    footprint(m, x + 0.14, z + 0.1, 2.75 * s, 2.28 * s)
    m.at(x, 0, z, yaw, s, () => {
      const c = cottage(m, v)
      smoke.push(
        c
          .multiplyScalar(s)
          .applyAxisAngle(new T.Vector3(0, 1, 0), yaw)
          .add(new T.Vector3(x, 0.08, z)),
      )
    })
  }
  m.at(13.9, 0, -13.5, -0.43, 0.91, () => church(m))
  const trees = [
    [12.4, 8.6, 4.9],
    [4.8, 5.7, 3.8],
    [17.1, 7.4, 4.8],
    [0.1, 1.9, 3.7],
    [10.6, 0.0, 3.2],
    [-2.4, 9.8, 4.1],
    [-7.6, 6.8, 4.0],
    [-12.8, 1.9, 3.7],
    [5.5, -6.2, 3.9],
    [15.4, -2.1, 3.8],
    [-0.4, -6.4, 3.2],
    [-6.3, -2.8, 3.6],
    [9.2, -10.7, 3.5],
    [-14.2, 6.5, 4.4],
    [18.4, 0, 3.9],
    [1.4, -9.5, 3.2],
  ]
  trees.forEach(([x, z, h], i) => {
    footprint(m, x + 0.13, z, h * 0.42, h * 0.34)
    pine(m, x, z, h, rnd() * 2, i === 0 || i === 4 || i === 6)
  })
  for (let i = 0; i < 123; i++) {
    const x = (rnd() - 0.5) * 80,
      z = -22 + rnd() * 5.1
    pine(m, x, z, 1.5 + rnd() * 2.2, rnd() * 4)
  }
  for (const [x, z] of [
    [6.0, 8.5],
    [4.3, 1.8],
    [11.3, 4.7],
    [1.1, -4],
    [-6.3, 4],
    [-0.9, 7.2],
    [13.7, -3.6],
    [-11, -3],
  ])
    lamp(m, x, z)
  fence(m, 8.6, 9.05, 3.17, -0.5)
  fence(m, 1.0, 10.65, 2.85, 0.42)
  fence(m, 10.0, -0.92, 2.8, -0.48)
  fence(m, -4.4, 4.45, 3.05, -0.44)
  market(m, 4.7, 8.8, -0.4)
  snowman(m, 10.9, 8.6, 0.9)
  garland(m, 8.3, 1.25, 0.34, 4.6)
  garland(m, -2.1, 5.5, -0.42, 4.5)
  return { group: m.finish(), smoke }
}

export const ROW_LENGTH = 12.6
export function routeRow(i: number) {
  const rnd = random(991 + i * 51),
    main = new Model(),
    decor = new Model()
  const yaw = i % 2 ? -0.37 : 0.46
  let chimney = new T.Vector3()
  main.at(0, 0, 0, yaw, 1, () => {
    chimney = cottage(main, i % 6, true)
  })
  chimney.applyAxisAngle(new T.Vector3(0, 1, 0), yaw)
  const house = main.finish()
  const center = new T.Group()
  house.position.set(-chimney.x, 0, -chimney.z)
  center.add(house)
  ground(decor, 115, ROW_LENGTH, 0, 831 + i)
  for (const s of [-1, 1]) {
    const path: Array<[number, number]> = []
    for (let j = 0; j <= 10; j++)
      path.push([
        s * (7.25 + Math.sin((j / 10) * Math.PI) ** 2 * (i % 2 ? -0.75 : 0.88)),
        ROW_LENGTH * (0.5 - j / 10),
      ])
    snowyLane(decor, path, 1.85)
    const nearX = (11.6 + rnd() * 2.3) * s,
      nearZ = (rnd() - 0.5) * 4
    decor.at(nearX, 0.02, nearZ, (rnd() - 0.5) * 1.05, 0.86 + rnd() * 0.24, () => {
      if ((i === 3 && s === 1) || (i === 7 && s === -1)) church(decor)
      else cottage(decor, i + (s === 1 ? 2 : 3))
    })
    lamp(decor, s * (7.4 + rnd() * 1.6), 1.4 + rnd() * 3)
    fence(decor, nearX, nearZ + 2.85, 2.85, (rnd() - 0.5) * 0.7)
    if ((s === 1 && i % 3 === 0) || (s === -1 && i % 3 === 1)) {
      market(decor, s * 9.75, -3.1, -s * 0.35)
      garland(decor, s * 9.6, 1.7, -s * 0.4, 4.3)
    } else snowman(decor, s * 8.8, -1.4, 0.85 + rnd() * 0.21)
    decor.ball('#9bb2c8', s * 7.85, 0, 4.0, 0.54, 0.19, 0.72)
    decor.ball('#acbfd0', s * 7.98, 0.055, 4.25, 0.36, 0.18, 0.42)
    for (let j = 0; j < 9; j++) {
      const x = s * (j < 2 ? 8.2 + rnd() * 1.25 : 16 + rnd() * 28)
      const z = j < 2 ? (j ? -4.7 : 4.8) : (rnd() - 0.5) * ROW_LENGTH
      pine(decor, x, z, 2.1 + rnd() * (j < 2 ? 1.6 : 3.6), rnd() * 2.5, j === 1 && i % 3 === 0)
    }
    if (i % 2 === 0) decor.at(s * (20 + rnd() * 3), 0, -1, rnd(), 0.88, () => cottage(decor, i + 1))
  }
  const group = decor.finish()
  group.add(center)
  const { w, d, h, rise } = dimensions(i % 6)
  function roofHeight(x: number, z: number) {
    const dx = x - center.position.x - house.position.x
    const dz = z - group.position.z - house.position.z
    const localX = dx * Math.cos(yaw) - dz * Math.sin(yaw),
      localZ = dx * Math.sin(yaw) + dz * Math.cos(yaw)
    if (Math.abs(localX) > w / 2 + 0.2 || Math.abs(localZ) > d / 2 + 0.24) return 0
    return h + rise * (1 - Math.abs(localX) / (w / 2)) + 0.23
  }
  return { group, center, height: chimney.y, roofHeight }
}
