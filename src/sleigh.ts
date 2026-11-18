import * as T from 'three'
import { Model, silhouette, type Point } from './model'

const gold = '#f4b852',
  lightGold = '#ffde8a',
  crimson = '#c92e43'
const fur = '#fff0d7',
  leather = '#542c38',
  wood = '#98532e'
const turned = (profile: number[][]) =>
  new T.LatheGeometry(
    profile.map(([r, y]) => new T.Vector2(r, y)),
    32,
  )
const coat = turned([
  [0.02, 0.35],
  [0.42, 0.37],
  [0.61, 0.44],
  [0.645, 0.54],
  [0.65, 0.72],
  [0.64, 0.9],
  [0.61, 1.08],
  [0.53, 1.31],
  [0.41, 1.49],
  [0.26, 1.58],
  [0.02, 1.6],
])
const coatHem = turned([
  [0.6, 0.43],
  [0.645, 0.445],
  [0.659, 0.48],
  [0.659, 0.55],
  [0.649, 0.585],
])
const belt = turned([
  [0.644, 0.725],
  [0.66, 0.737],
  [0.662, 0.855],
  [0.649, 0.873],
])

export function parcel(
  m: Model,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  color: string,
  ribbon: string,
) {
  m.box(color, x, y + h * 0.5, z, w, h, d)
  m.box(color, x, y + h * 0.91, z, w * 1.07, h * 0.2, d * 1.07)
  m.box(ribbon, x, y + h * 0.5, z, w * 0.2, h * 1.035, d * 1.08)
  m.box(ribbon, x, y + h * 0.5, z, w * 1.08, h * 1.04, d * 0.19)
  for (const side of [-1, 1]) {
    m.ball(ribbon, x + side * w * 0.15, y + h * 1.1, z, w * 0.19, h * 0.12, d * 0.12)
  }
}

function santa(m: Model) {
  m.geo(coat, '#dc3a46', [0, 0, 0], [1, 1, 0.94])
  m.geo(coatHem, fur, [0, 0, 0], [1, 1, 0.94])
  m.geo(belt, leather, [0, 0, 0], [1, 1, 0.94])
  m.box(gold, 0.1, 0.8, 0.615, 0.22, 0.154, 0.06)
  m.box(leather, 0.1, 0.8, 0.649, 0.12, 0.065, 0.035)
  for (const y of [1.01, 1.22]) m.ball(gold, 0.38, y, y > 1.1 ? 0.385 : 0.447, 0.041, 0.041, 0.031, true)
  for (const side of [-1, 1]) {
    m.ball(crimson, 0.44, 0.46, side * 0.29, 0.51, 0.29, 0.26)
    m.ball(leather, 0.77, 0.27, side * 0.3, 0.35, 0.2, 0.24)
  }
  m.ball('#f3b994', 0.09, 1.88, 0, 0.51, 0.51, 0.47, true)
  for (const s of [-1, 1]) {
    m.ball('#e7b18e', -0.11, 1.91, s * 0.45, 0.13, 0.16, 0.12, true)
    m.ball('#fff5df', 0.37, 2.08, s * 0.3, 0.12, 0.042, 0.077, true)
    m.ball('#f49a83', 0.35, 1.83, s * 0.353, 0.13, 0.105, 0.085, true)
    m.ball('#fff9e3', 0.49, 1.77, s * 0.132, 0.17, 0.103, 0.19, true)
  }
  m.ball('#f19a7d', 0.54, 1.9, 0.04, 0.17, 0.15, 0.16, true)
  m.ball('#ffead2', -0.03, 2.2, 0, 0.56, 0.19, 0.51, true)
  m.cylinder('#ed404b', -0.12, 2.49, -0.01, 0.48, 0.58, 24, 0.44, [0, 0, 0.3])
  m.beam('#cb2940', [-0.2, 2.73, 0], [-0.58, 2.65, 0.055], 0.22, 0.095)
  m.ball('#38665b', -0.11, 1.48, -0.01, 0.43, 0.19, 0.47, true)
  for (const side of [-1, 1]) {
    const shoulder: Point = [0.07, 1.3, side * 0.43]
    const cuff: Point = [0.63, 1.16, side * 0.51]
    m.beam('#ea4148', shoulder, cuff, 0.21, 0.16)
    m.ball('#e54246', ...shoulder, 0.226, 0.228, 0.2, true)
    m.ball(fur, ...cuff, 0.18, 0.17, 0.18)
    m.ball('#38665b', 0.78, 1.18, side * 0.5, 0.2, 0.15, 0.15)
    m.ball('#477d65', 0.79, 1.25, side * 0.58, 0.098, 0.083, 0.072, true)
  }
}

function sleighBody() {
  const m = new Model(true)
  const sides = silhouette(
    [
      [-1.87, 1.78],
      [-1.55, 1.72],
      [-1.32, 1.27],
      [-0.95, 1.09],
      [0.43, 1.02],
      [0.95, 1.1],
      [1.38, 1.43],
      [1.55, 1.76],
      [1.74, 1.77],
      [1.72, 1.36],
      [1.46, 0.94],
      [1.03, 0.57],
      [0.6, 0.42],
      [-1.24, 0.42],
      [-1.64, 0.65],
    ],
    0.14,
    0.045,
  )
  m.box('#a32c3a', -0.1, 0.69, 0, 2.78, 0.4, 1.58)
  m.box('#7f3433', -0.47, 0.91, 0, 1.15, 0.2, 1.48)
  m.box('#b73741', -1.64, 1.23, 0, 0.23, 1.12, 1.67, [0, 0, 0.14])
  m.box(lightGold, -1.73, 1.8, 0, 0.2, 0.095, 1.84)
  for (const s of [-1, 1]) {
    const z = s * 0.84
    m.geo(sides, '#d83f48', [0, 0, z], [1, 1, 1])
    const lip: Point[] = [
      [-1.87, 1.79, z],
      [-1.55, 1.74, z],
      [-1.32, 1.28, z],
      [-0.95, 1.1, z],
      [0.43, 1.03, z],
      [0.96, 1.12, z],
      [1.4, 1.46, z],
      [1.56, 1.77, z],
      [1.73, 1.79, z],
    ]
    for (let i = 1; i < lip.length; i++) m.beam(lightGold, lip[i - 1], lip[i], 0.077)
    m.beam(gold, [-1.18, 0.56, z], [0.86, 0.57, z], 0.045)
    for (const x of [-1.02, 0.83]) m.beam(gold, [x - 0.13, 0.05, z], [x + 0.06, 0.61, z], 0.079)
    const runner: Point[] = [
      [-2.02, 0.11, z],
      [-1.72, -0.012, z],
      [1.29, -0.012, z],
      [1.75, 0.078, z],
      [2.04, 0.31, z],
      [2.12, 0.55, z],
      [2.04, 0.68, z],
      [1.92, 0.67, z],
    ]
    for (let i = 1; i < runner.length; i++) m.beam('#f3bb57', runner[i - 1], runner[i], 0.092)
    m.ball(lightGold, 1.93, 0.67, z, 0.094)
    const outside = s * 0.953
    m.box(lightGold, -0.27, 0.814, outside, 0.17, 0.17, 0.035, [0, 0, Math.PI / 4])
    for (const dx of [-0.24, 0.24]) m.ball(gold, -0.27 + dx, 0.813, outside, 0.043)
    for (const d of [-1, 1]) {
      const flourish: Point[] = [
        [-0.27 + d * 0.38, 0.82, outside],
        [-0.27 + d * 0.53, 0.87, outside],
        [-0.27 + d * 0.66, 0.94, outside],
        [-0.27 + d * 0.78, 0.93, outside],
        [-0.27 + d * 0.8, 0.87, outside],
      ]
      for (let j = 1; j < flourish.length; j++) m.beam(gold, flourish[j - 1], flourish[j], 0.017)
    }
  }
  m.at(-0.03, 0.89, 0, -0.18, 1, () => santa(m))
  m.ball('#8d4946', -1.36, 1.44, -0.04, 0.64, 0.56, 0.59, true)
  m.cylinder('#aa6151', -1.29, 1.95, 0.2, 0.19, 0.25, 12, 1.6, [0, 0, 0.17])
  m.cylinder(gold, -1.3, 1.89, 0.2, 0.206, 0.07, 12)
  m.beam(gold, [-1.32, 1.89, 0.39], [-1.5, 1.65, 0.49], 0.027, 0.021)
  m.ball(lightGold, -1.5, 1.65, 0.49, 0.046)
  parcel(m, -1.42, 1.56, -0.36, 0.72, 0.65, 0.63, '#348e83', '#ffd36e')
  m.at(-1.67, 1.65, 0.24, 0.19, 1, () => parcel(m, 0, 0, 0, 0.6, 0.49, 0.55, '#db5248', '#ffe3a1'))
  parcel(m, -1.57, 2.17, -0.27, 0.45, 0.37, 0.42, '#447ca0', '#f6c162')
  const body = m.finish(),
    rider = new T.Group()
  rider.position.set(-0.03, 0.89, 0)
  rider.rotation.y = -0.18
  body.add(rider)
  const curls = new Model(true)
  curls.ball(fur, 0, -0.11, 0, 0.46, 0.45, 0.42, true)
  for (let i = 0; i < 11; i++) {
    const a = (i / 10) * Math.PI * 1.48 - Math.PI * 0.74
    curls.ball(
      i % 4 ? '#fff7e6' : '#e8dbc5',
      Math.cos(a) * 0.27 - 0.07,
      -0.19 + Math.abs(Math.sin(a)) * 0.1,
      Math.sin(a) * 0.34,
      0.18,
      0.24,
      0.14,
      true,
    )
  }
  const beard = curls.finish()
  beard.position.set(0.23, 1.67, 0.02)
  rider.add(beard)
  const features = new Model(true)
  for (const s of [-1, 1]) {
    features.ball('#fff4dc', 0.4, 0, s * 0.316, 0.085, 0.079, 0.072, true)
    features.ball('#422f37', 0.439, -0.001, s * 0.355, 0.048, 0.059, 0.038, true)
    features.ball('#fff4dc', 0.459, 0.019, s * 0.38, 0.016, 0.016, 0.012, true)
  }
  const eyes = features.finish()
  eyes.position.y = 1.99
  rider.add(eyes)
  const puff = new Model(true)
  puff.ball('#fff4dc', 0, 0, 0, 0.21, 0.225, 0.21, true)
  const pom = puff.finish()
  rider.add(pom)
  const scarfGeo = new T.BufferGeometry(),
    strips = 12,
    indices: number[] = [],
    shades: number[] = []
  scarfGeo.setAttribute(
    'position',
    new T.Float32BufferAttribute(new Float32Array((strips + 1) * 6), 3).setUsage(T.DynamicDrawUsage),
  )
  for (let i = 0; i <= strips; i++) {
    const c = new T.Color(i === 10 || i === 12 ? '#e4c37b' : '#287267')
    shades.push(c.r, c.g, c.b, c.r, c.g, c.b)
    if (i < strips) {
      const n = i * 2
      indices.push(n, n + 1, n + 2, n + 2, n + 1, n + 3)
    }
  }
  scarfGeo.setAttribute('color', new T.Float32BufferAttribute(shades, 3))
  scarfGeo.setIndex(indices)
  const scarf = new T.Mesh(scarfGeo, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide }))
  scarf.frustumCulled = false
  rider.add(scarf)
  const lantern = new Model(true)
  lantern.beam(gold, [0, 0, 0], [0, -0.14, 0], 0.026)
  lantern.cylinder(gold, 0, -0.18, 0, 0.18, 0.11, 6, 0.6)
  lantern.cylinder('#ffcc77', 0, -0.35, 0, 0.13, 0.27, 6, 1, [0, 0, 0], true)
  lantern.cylinder(gold, 0, -0.52, 0, 0.16, 0.08, 6)
  for (const side of [-1, 1])
    lantern.beam(gold, [side * 0.12, -0.22, 0.046], [side * 0.12, -0.49, 0.046], 0.019)
  lantern.halo('#ffc172', [0, -0.33, 0.13], 0.95, 0.95, [0, 0, 0], 0.65)
  const lamp = lantern.finish()
  lamp.position.set(1.49, 1.31, 1.0)
  body.add(lamp)
  function animate(t: number) {
    beard.rotation.z = -0.07 + Math.sin(t * 3.8) * 0.067
    beard.rotation.x = Math.sin(t * 2.1) * 0.035
    eyes.scale.y = 1 - 0.94 * Math.max(0, Math.cos(t * 1.37)) ** 125
    pom.position.set(-0.62 + Math.sin(t * 3) * 0.038, 2.57 + Math.cos(t * 2.5) * 0.051, 0.065)
    lamp.rotation.z = -0.11 + Math.sin(t * 2.4) * 0.11
    const p = scarfGeo.attributes.position
    for (let i = 0; i <= strips; i++) {
      const u = i / strips,
        x = -0.28 - 1.38 * u
      const y = 1.49 + u * (0.19 + 0.17 * Math.sin(t * 5.3 - u * 7.5))
      const z = 0.34 + u * (0.17 + 0.13 * Math.sin(t * 4.2 - u * 6))
      p.setXYZ(i * 2, x, y - 0.1, z)
      p.setXYZ(i * 2 + 1, x, y + 0.12, z + 0.046)
    }
    p.needsUpdate = true
  }
  return { body, animate }
}

function reindeer(lead: boolean) {
  const group = new T.Group()
  const torso = new Model(true)
  let m = torso
  m.ball('#ac6639', 0.02, 0.99, 0, 0.96, 0.47, 0.37, true)
  m.ball('#c3884e', 0.57, 1.14, 0, 0.48, 0.55, 0.35, true)
  m.beam('#ab6739', [0.52, 1.13, 0], [0.91, 1.9, 0], 0.35, 0.25)
  m.beam('#e8bc81', [0.75, 1.14, 0], [1.02, 1.77, 0], 0.21, 0.16)
  m.ball('#e6bb84', -0.91, 1.22, 0, 0.2, 0.15, 0.15, true)
  for (const s of [-1, 1]) {
    m.beam(crimson, [0.41, 1.43, s * 0.27], [0.65, 0.84, s * 0.3], 0.075)
    m.ball(gold, 0.6, 1.03, s * 0.36, 0.092, 0.102, 0.092, true)
    for (const dx of [-0.28, -0.51, -0.67]) m.ball('#e1b077', dx, 1.19 + dx * 0.08, s * 0.3, 0.046)
  }
  m = new Model(true)
  m.ball('#b87743', 1.01, 1.95, 0, 0.43, 0.31, 0.28, true)
  m.ball('#e3b77f', 1.33, 1.83, 0, 0.31, 0.19, 0.23, true)
  m.ball(lead ? '#fb6a53' : '#46303a', 1.56, 1.89, 0, 0.13, 0.12, 0.15, true, lead)
  if (lead) m.halo('#ff5c47', [1.56, 1.89, 0.11], 0.58, 0.58, [0, 0, 0], 0.52)
  for (const s of [-1, 1]) {
    m.beam('#b47646', [0.78, 2.08, s * 0.16], [0.64, 2.3, s * 0.49], 0.15, 0.035)
    m.beam('#e6b488', [0.76, 2.14, s * 0.26], [0.66, 2.27, s * 0.44], 0.067, 0.022)
    m.ball('#fff4dc', 1.14, 2.01, s * 0.241, 0.092, 0.102, 0.057, true)
    m.ball('#392d30', 1.17, 2.01, s * 0.269, 0.067, 0.082, 0.043, true)
    m.ball('#fff3da', 1.16, 2.036, s * 0.275, 0.023)
    const a: Point = [0.88, 2.15, s * 0.12]
    const b: Point = [0.76, 2.47, s * 0.22]
    const d: Point = [0.5, 2.67, s * 0.35]
    m.beam('#87552e', a, b, 0.082, 0.067)
    m.beam('#a87540', b, d, 0.071, 0.055)
    m.beam('#c18f54', d, [0.26, 2.87, s * 0.39], 0.055, 0.027)
    m.beam('#c99354', b, [0.85, 2.72, s * 0.28], 0.055, 0.018)
    m.beam('#d3a160', d, [0.56, 2.91, s * 0.39], 0.048, 0.018)
  }
  group.add(torso.finish())
  const head = new T.Group(),
    face = m.finish()
  head.position.set(0.9, 1.78, 0)
  face.position.copy(head.position).negate()
  head.add(face)
  group.add(head)
  const legs: T.Group[] = [],
    shins: T.Group[] = []
  for (const x of [-0.6, 0.59])
    for (const s of [-1, 1]) {
      const leg = new Model(true),
        shin = new Model(true)
      const kneeX = x < 0 ? -0.2 : 0.18
      const hoofX = x < 0 ? -0.52 : -0.1
      leg.beam(wood, [0, 0, 0], [kneeX, -0.48, 0], 0.13, 0.092)
      leg.ball(wood, kneeX, -0.47, 0, 0.1, 0.11, 0.095, true)
      shin.beam('#c5935d', [0, 0, 0], [hoofX - kneeX, -0.4, 0], 0.084, 0.06)
      shin.ball('#4e3635', hoofX - kneeX + 0.015, -0.41, 0, 0.12, 0.087, 0.083, true)
      const joint = leg.finish()
      const lower = shin.finish()
      lower.position.set(kneeX, -0.48, 0)
      joint.add(lower)
      shins.push(lower)
      joint.position.set(x, 0.87, s * 0.205)
      group.add(joint)
      legs.push(joint)
    }
  return { group, legs, shins, head }
}

export function makeSleigh() {
  const rig = new T.Group(),
    team = sleighBody(),
    body = team.body
  rig.add(body)
  const deer = [reindeer(false), reindeer(true)]
  const places: Point[] = [
    [3.56, 0.41, -0.6],
    [6.11, 0.62, 0.18],
  ]
  const threads: T.Line[] = []
  const lineMaterial = new T.LineBasicMaterial({ color: '#e9b964' })
  for (let i = 0; i < deer.length; i++) {
    deer[i].group.position.set(...places[i])
    rig.add(deer[i].group)
    for (const side of [-1, 1]) {
      const line = new T.Line(new T.BufferGeometry(), lineMaterial)
      line.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(13 * 3), 3))
      line.frustumCulled = false
      line.userData.side = side
      rig.add(line)
      threads.push(line)
    }
  }
  function animate(t: number) {
    team.animate(t)
    body.rotation.z = Math.sin(t * 1.8) * 0.026
    deer.forEach(({ group, legs, shins, head }, i) => {
      const phase = t * 3.3 + i * 1.7
      group.position.y = places[i][1] + Math.sin(phase) * 0.13
      group.rotation.z = Math.sin(phase - 0.7) * 0.055
      legs.forEach((leg, j) => {
        leg.rotation.z = Math.sin(phase + (j === 0 || j === 3 ? 0 : Math.PI)) * 0.54 + (j < 2 ? -0.26 : 0.29)
      })
      shins.forEach((joint, j) => {
        joint.rotation.z = -0.23 + Math.sin(phase + 1.1 + (j === 0 || j === 3 ? 0 : Math.PI)) * 0.36
      })
      head.rotation.z = 0.02 + Math.sin(phase - 0.9) * 0.075
      head.rotation.y = Math.sin(t * 1.15 + i * 2.9) * 0.12
      for (let s = 0; s < 2; s++) {
        const side = s ? 1 : -1
        const line = threads[i * 2 + s]
        const attr = line.geometry.getAttribute('position')
        const start = i ? deer[0].group.position : body.position
        const ax = i ? start.x + 0.58 : 0.69,
          ay = i ? start.y + 1.2 : 2.04
        const az = i ? start.z + side * 0.33 : side * 0.49
        for (let j = 0; j <= 12; j++) {
          const k = j / 12
          attr.setXYZ(
            j,
            T.MathUtils.lerp(ax, group.position.x + 0.54, k),
            T.MathUtils.lerp(ay, group.position.y + 1.2, k) - Math.sin(k * Math.PI) * (i ? 0.26 : 0.47),
            T.MathUtils.lerp(az, group.position.z + side * 0.33, k),
          )
        }
        attr.needsUpdate = true
      }
    })
  }
  animate(0)
  return { rig, animate }
}
