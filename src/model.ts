import * as T from 'three'

export type Point = [number, number, number]
type Part = { positions: number[]; normals: number[]; colors: number[]; indices: number[] }
const empty = (): Part => ({ positions: [], normals: [], colors: [], indices: [] })
const cube = new T.BoxGeometry(1, 1, 1)
const stone = new T.IcosahedronGeometry(1, 0)
const round = new T.IcosahedronGeometry(1, 1)
const smoothRound = new T.SphereGeometry(1, 18, 13)
const tubes = new Map<string, T.BufferGeometry>()
const palette = new Map<string, T.Color>()
const matte = new T.MeshLambertMaterial({ vertexColors: true, flatShading: true })
matte.onBeforeCompile = (shader) => {
  shader.vertexShader =
    'varying vec3 vSnowPosition;\n' +
    shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n vSnowPosition=position;',
    )
  shader.fragmentShader =
    'varying vec3 vSnowPosition;\n' +
    shader.fragmentShader.replace(
      '#include <color_fragment>',
      `
    #include <color_fragment>
    float snow = smoothstep(.14,.39,vColor.r) * smoothstep(.012,.075,vColor.b-vColor.r);
    float drifts = .50 + .28*sin(vSnowPosition.x*1.36 + .8*sin(vSnowPosition.z*1.47)) + .22*cos(vSnowPosition.z*2.35 - vSnowPosition.x*.71);
    diffuseColor.rgb *= mix(vec3(1.), mix(vec3(.76,.84,.98),vec3(1.08,1.06,1.01),drifts),snow*.74);
  `,
    )
}
const bright = new T.MeshBasicMaterial({ vertexColors: true })
const satin = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.62, metalness: 0.05 })
const brass = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.28, metalness: 0.59 })
const fleece = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.94 })
const enamel = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.24, metalness: 0.13 })
const finishes = [matte, bright, satin, brass, fleece, enamel]
const brassColors = new Set(['#f4b852', '#ffde8a', '#f3bb57', '#ffe3a1', '#ffd36e', '#f6c162'])
const furColors = new Set(['#fff0d7', '#fff7e6', '#fff9e3', '#ffead2', '#fff4dc', '#e8dbc5'])
const glossColors = new Set(['#d83f48', '#c92e43', '#422f37', '#392d30', '#46303a', '#4e3635', '#542c38'])
const haloPixels = new Uint8Array(32 * 32 * 4)
for (let y = 0; y < 32; y++)
  for (let x = 0; x < 32; x++) {
    const r = Math.hypot((x - 15.5) / 16, (y - 15.5) / 16)
    haloPixels.set([255, 255, 255, Math.round(255 * Math.max(0, 1 - r) ** 2.4)], (y * 32 + x) * 4)
  }
const haloTexture = new T.DataTexture(haloPixels, 32, 32)
export { haloTexture }
haloTexture.magFilter = haloTexture.minFilter = T.LinearFilter
haloTexture.needsUpdate = true
const haloMaterial = new T.MeshBasicMaterial({
  map: haloTexture,
  transparent: true,
  vertexColors: true,
  side: T.DoubleSide,
  blending: T.NormalBlending,
  depthWrite: false,
})
haloMaterial.onBeforeCompile = (shader) => {
  shader.fragmentShader = shader.fragmentShader.replace(
    '#include <fog_fragment>',
    `
    #ifdef USE_FOG
      gl_FragColor.a *= 1.0-smoothstep(fogNear,fogFar,vFogDepth);
    #endif
  `,
  )
}

function tube(sides: number, top: number) {
  const key = sides + '/' + top
  if (!tubes.has(key)) tubes.set(key, new T.CylinderGeometry(top, 1, 1, sides, 1, false))
  return tubes.get(key)!
}

/** Bake toy parts into one lit mesh and one luminous mesh per movable object. */
export class Model {
  private batches = finishes.map(empty)
  private frame = new T.Matrix4()
  private transform = new T.Matrix4()
  private normal = new T.Matrix3()
  private point = new T.Vector3()
  private orientation = new T.Quaternion()
  private euler = new T.Euler()
  private offset = new T.Vector3()
  private size = new T.Vector3()
  private halos = {
    positions: [] as number[],
    colors: [] as number[],
    uvs: [] as number[],
    indices: [] as number[],
  }
  private instances = new Map<T.Mesh, T.Matrix4[]>()
  constructor(private character = false) {}

  at(x: number, y: number, z: number, yaw: number, scale: number, draw: () => void) {
    const parent = this.frame
    this.frame = parent.clone().multiply(new T.Matrix4().makeRotationY(yaw).setPosition(x, y, z))
    this.frame.scale(new T.Vector3(scale, scale, scale))
    draw()
    this.frame = parent
  }

  geo(
    geometry: T.BufferGeometry,
    color: string,
    pos: Point,
    size: Point,
    rot: Point = [0, 0, 0],
    glow = false,
  ) {
    this.orientation.setFromEuler(this.euler.set(...rot))
    this.transform
      .compose(this.offset.set(...pos), this.orientation, this.size.set(...size))
      .premultiply(this.frame)
    this.write(geometry, color, glow)
  }

  private write(geometry: T.BufferGeometry, color: string, glow: boolean) {
    if (!palette.has(color)) palette.set(color, new T.Color(color))
    const c = palette.get(color)!
    const material = !this.character
      ? 0
      : brassColors.has(color)
        ? 3
        : furColors.has(color)
          ? 4
          : glossColors.has(color)
            ? 5
            : 2
    const batch = this.batches[glow ? 1 : material]
    const p = geometry.getAttribute('position')
    const n = geometry.getAttribute('normal')
    const base = batch.positions.length / 3
    this.normal.getNormalMatrix(this.transform)
    for (let i = 0; i < p.count; i++) {
      this.point.fromBufferAttribute(p, i).applyMatrix4(this.transform)
      batch.positions.push(this.point.x, this.point.y, this.point.z)
      this.point.fromBufferAttribute(n, i).applyNormalMatrix(this.normal)
      batch.normals.push(this.point.x, this.point.y, this.point.z)
      batch.colors.push(c.r, c.g, c.b)
    }
    const index = geometry.index
    const count = index ? index.count : p.count
    for (let i = 0; i < count; i++) batch.indices.push(base + (index ? index.getX(i) : i))
  }

  box(
    color: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    rot: Point = [0, 0, 0],
    glow = false,
  ) {
    this.geo(cube, color, [x, y, z], [w, h, d], rot, glow)
  }
  ball(
    color: string,
    x: number,
    y: number,
    z: number,
    a: number,
    b = a,
    c = a,
    smooth = false,
    glow = false,
  ) {
    this.geo(
      smooth ? (this.character ? smoothRound : round) : stone,
      color,
      [x, y, z],
      [a, b, c],
      [0, 0, 0],
      glow,
    )
  }
  cylinder(
    color: string,
    x: number,
    y: number,
    z: number,
    radius: number,
    height: number,
    sides = 8,
    top = 1,
    rot: Point = [0, 0, 0],
    glow = false,
  ) {
    this.geo(tube(sides, top), color, [x, y, z], [radius, height, radius], rot, glow)
  }
  beam(color: string, a: Point, b: Point, width: number, endWidth = width, glow = false) {
    const start = new T.Vector3(...a)
    const end = new T.Vector3(...b)
    const axis = end.clone().sub(start)
    const len = axis.length()
    this.orientation.setFromUnitVectors(this.offset.set(0, 1, 0), axis.normalize())
    this.transform
      .compose(start.lerp(end, 0.5), this.orientation, this.size.set(width, len, width))
      .premultiply(this.frame)
    this.write(tube(6, endWidth / width), color, glow)
  }
  halo(color: string, pos: Point, width: number, height: number, rotation: Point, power: number) {
    const h = this.halos,
      base = h.positions.length / 3,
      tint = new T.Color(color)
    this.orientation.setFromEuler(this.euler.set(...rotation))
    this.transform
      .compose(this.offset.set(...pos), this.orientation, this.size.set(width, height, 1))
      .premultiply(this.frame)
    for (const [x, y] of [
      [0, 0],
      [1, 0],
      [1, 1],
      [0, 1],
    ]) {
      this.point.set(x - 0.5, y - 0.5, 0).applyMatrix4(this.transform)
      h.positions.push(this.point.x, this.point.y, this.point.z)
      h.colors.push(tint.r, tint.g, tint.b, power)
      h.uvs.push(x, y)
    }
    h.indices.push(base, base + 1, base + 2, base, base + 2, base + 3)
  }
  instance(prefab: T.Group, x: number, z: number, yaw: number, size: number) {
    this.orientation.setFromEuler(this.euler.set(0, yaw, 0))
    const matrix = new T.Matrix4()
      .compose(this.offset.set(x, 0, z), this.orientation, this.size.setScalar(size))
      .premultiply(this.frame)
    for (const child of prefab.children) {
      if (!(child instanceof T.Mesh)) continue
      if (!this.instances.has(child)) this.instances.set(child, [])
      this.instances.get(child)!.push(matrix)
    }
  }
  finish() {
    const group = new T.Group()
    this.batches.forEach((batch, i) => {
      if (!batch.indices.length) return
      const g = new T.BufferGeometry()
      g.setAttribute('position', new T.Float32BufferAttribute(batch.positions, 3))
      g.setAttribute('normal', new T.Float32BufferAttribute(batch.normals, 3))
      g.setAttribute('color', new T.Float32BufferAttribute(batch.colors, 3))
      g.setIndex(batch.indices)
      g.computeBoundingSphere()
      const mesh = new T.Mesh(g, finishes[i])
      mesh.castShadow = mesh.receiveShadow = i !== 1
      group.add(mesh)
    })
    const h = this.halos
    if (h.indices.length) {
      const g = new T.BufferGeometry()
      g.setAttribute('position', new T.Float32BufferAttribute(h.positions, 3))
      g.setAttribute('color', new T.Float32BufferAttribute(h.colors, 4))
      g.setAttribute('uv', new T.Float32BufferAttribute(h.uvs, 2))
      g.setIndex(h.indices)
      const light = new T.Mesh(g, haloMaterial)
      light.renderOrder = 1
      group.add(light)
    }
    for (const [model, matrices] of this.instances) {
      const mesh = new T.InstancedMesh(model.geometry, model.material, matrices.length)
      matrices.forEach((matrix, i) => mesh.setMatrixAt(i, matrix))
      mesh.castShadow = model.castShadow
      mesh.receiveShadow = model.receiveShadow
      mesh.computeBoundingSphere()
      group.add(mesh)
    }
    return group
  }
}

export function silhouette(points: number[][], depth: number, bevel = 0) {
  const shape = new T.Shape()
  points.forEach(([x, y], i) => (i ? shape.lineTo(x, y) : shape.moveTo(x, y)))
  shape.closePath()
  const g = new T.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: bevel > 0,
    bevelSize: bevel,
    bevelThickness: bevel,
    bevelSegments: 1,
    curveSegments: 1,
  })
  return g.translate(0, 0, -depth / 2)
}

export function random(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let n = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    n = (n + Math.imul(n ^ (n >>> 7), 61 | n)) ^ n
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296
  }
}
