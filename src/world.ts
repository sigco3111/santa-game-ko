import * as T from 'three'
import { Model } from './model'
import { makeSleigh, parcel } from './sleigh'
import { heroVillage, routeRow, ROW_LENGTH } from './village'
import { Effects } from './particles'
import { paintSky } from './sky'
import { lightMap, northernLights, mountains } from './atmosphere'

const RELEASE_Z = 2.7,
  ALTITUDE = 7.25,
  FALL_TIME = 0.56,
  THROW_LEAD = 0.72
const ringGeometry = new T.TorusGeometry(0.79, 0.042, 5, 36).rotateX(Math.PI / 2)
const diamondGeometry = new T.OctahedronGeometry(0.12)
const mint = new T.MeshBasicMaterial({ color: '#9dffcb' })
const amber = new T.MeshBasicMaterial({ color: '#ffcb70' })
const sightMaterial = new T.MeshBasicMaterial({ color: '#fff6c7', side: T.DoubleSide, depthTest: false })
const flightLanes = [0, -2.9, 2.4, 4.8, 0.9, -3.5, -1.2, 3.6, 1.0, -4.4, -2.2, 2.8, 4.7, -0.5, -3.0, 1.8]
type Delivery = { start: T.Vector3; end: T.Vector3; target?: Row; age: number; object: T.Group }
type Row = ReturnType<typeof routeRow> & {
  ring: T.Group
  status: 'open' | 'pending' | 'done'
  mouth: T.Vector3
}
export type Quality = 'low' | 'medium' | 'high'
const presets = {
  low: { max: 1.0, min: 0.55, shadow: 0, detail: 0 },
  medium: { max: 1.35, min: 0.65, shadow: 1024, detail: 1 },
  high: { max: 1.75, min: 0.78, shadow: 1536, detail: 2 },
}
const introPath = new T.CatmullRomCurve3(
  [
    [7.45, 2.35, 19],
    [7.35, 3.0, 8.7],
    [8.0, 6.4, -1.8],
    [8.4, 8.6, -4.7],
    [8.3, 11.6, 6.4],
    [4.9, 14.1, 17.3],
  ].map((p) => new T.Vector3(...p)),
)
const introLook = new T.CatmullRomCurve3(
  [
    [7.1, 2.65, -6],
    [3.4, 4.1, -3],
    [0.35, 7.6, 1.9],
    [0.15, 8.1, 1.2],
    [0, 7.0, 0.3],
    [0, 2.65, -10.3],
  ].map((p) => new T.Vector3(...p)),
)

function targetRing() {
  const model = new Model()
  model.geo(ringGeometry, '#ffffff', [0, 0, 0], [1, 1, 1], [0, 0, 0], true)
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    model.geo(
      diamondGeometry,
      '#ffffff',
      [Math.sin(a) * 0.97, 0.025, Math.cos(a) * 0.97],
      [0.65, 1, 0.65],
      [0, 0, 0],
      true,
    )
  }
  return model.finish()
}

function sight() {
  const group = new T.Group()
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2
    const arc = new T.RingGeometry(0.47, 0.54, 13, 1, a + 0.18, Math.PI / 2 - 0.36).rotateX(-Math.PI / 2)
    group.add(new T.Mesh(arc, sightMaterial))
  }
  const p = new T.Mesh(new T.OctahedronGeometry(0.096, 0), sightMaterial)
  group.add(p)
  group.renderOrder = 5
  group.children.forEach((v) => {
    v.renderOrder = 5
  })
  return group
}

export type WorldEvents = {
  delivered: (hit: boolean, point: T.Vector3) => void
  lock: () => void
}

export class World {
  private renderer: T.WebGLRenderer
  private scene = new T.Scene()
  private aurora = northernLights()
  private moon = new T.DirectionalLight('#dbe4ff', 1.68)
  private quality: Quality = 'medium'
  private ratio = 1
  private fastSeconds = 0
  private slowSeconds = 0
  private intro: number | null = null
  private titleCamera = new T.OrthographicCamera(-16, 16, 9, -9, 0.1, 140)
  private chase = new T.PerspectiveCamera(51, 1, 0.1, 210)
  private camera: T.Camera = this.titleCamera
  private village = heroVillage()
  private route = new T.Group()
  private rows: Row[] = []
  private sleigh = makeSleigh()
  private effects: Effects
  private cursor = sight()
  private line = new T.Line(
    new T.BufferGeometry(),
    new T.LineDashedMaterial({
      color: '#ffe7a0',
      dashSize: 0.14,
      gapSize: 0.17,
      transparent: true,
      opacity: 0.75,
      depthTest: false,
    }),
  )
  private packages: T.Group[] = []
  private falling: Delivery[] = []
  private settled: { object: T.Group; height: number; age: number }[] = []
  private point = new T.Vector3()
  private anchor = new T.Vector3()
  private home = new T.Vector3()
  private look = new T.Vector3()
  private drops = 0
  private laneIndex = 0
  private cooldown = 0
  private speed = 5.4
  private x = 0
  private velocity = 0
  private trailClock = 0
  private time = 0
  private air = false
  private width = 1
  private height = 1
  private locked: Row | undefined
  private aim = new T.Vector3()
  private smokePoints: T.Vector3[] = []
  private titleSmoke: T.Vector3[] = []
  private frames = 0

  constructor(
    canvas: HTMLCanvasElement,
    private sky: HTMLCanvasElement,
    private events: WorldEvents,
  ) {
    this.renderer = new T.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    })
    this.renderer.setClearColor(0x000000, 0)
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = T.PCFShadowMap
    this.renderer.shadowMap.autoUpdate = false
    this.scene.environment = lightMap()
    this.scene.environmentIntensity = 0.56
    this.scene.add(this.aurora.mesh)
    this.scene.fog = new T.Fog('#607997', 28, 95)
    this.scene.add(new T.HemisphereLight('#c2d7ff', '#687994', 1.11))
    const moon = this.moon
    moon.position.set(-13, 23, 11)
    moon.castShadow = true
    moon.shadow.mapSize.set(1536, 1536)
    Object.assign(moon.shadow.camera, { left: -23, right: 23, top: 24, bottom: -19, near: 0.5, far: 74 })
    moon.shadow.camera.updateProjectionMatrix()
    moon.shadow.bias = -0.00035
    moon.shadow.normalBias = 0.032
    this.scene.add(moon)
    const rim = new T.DirectionalLight('#a9d7ff', 0.72)
    rim.position.set(7, 8, -10)
    this.scene.add(rim, this.village.group, this.route, this.sleigh.rig, this.cursor, this.line)
    const bounce = new T.DirectionalLight('#ffd4ad', 0.46)
    bounce.position.set(3, 4, 8)
    this.scene.add(bounce)
    this.effects = new Effects(this.scene)
    this.line.geometry.setAttribute('position', new T.Float32BufferAttribute(15 * 3, 3))
    this.line.geometry.setAttribute('lineDistance', new T.Float32BufferAttribute(15, 1))
    this.line.frustumCulled = false
    this.line.renderOrder = 4
    this.sleigh.rig.rotation.order = 'YXZ'
    this.route.visible = this.cursor.visible = this.line.visible = false
    this.setQuality('medium')
    this.resize()
    this.animate(0, 0, 0)
  }

  resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    const aspect = this.width / this.height,
      portrait = aspect < 0.85
    const h = portrait ? 29.4 : aspect < 1.25 ? 20.3 : 18.2,
      w = h * aspect
    this.titleCamera.left = -w / 2
    this.titleCamera.right = w / 2
    this.titleCamera.top = h / 2
    this.titleCamera.bottom = -h / 2
    const centerY = portrait ? 7.65 : 5.18
    this.titleCamera.position.set(0, centerY + 9.1, 27)
    this.titleCamera.lookAt(0, centerY, 0)
    this.titleCamera.updateProjectionMatrix()
    this.titleCamera.updateMatrixWorld()
    const baseV = portrait ? 0.595 : 0.435
    const angle = Math.atan2(9.1, 27)
    const anchorZ = 1.9
    this.home.set(
      (portrait ? -0.247 : 0.088) * w,
      centerY + ((0.5 - baseV) * h) / Math.cos(angle) + anchorZ * Math.tan(angle),
      anchorZ,
    )
    this.village.group.scale.setScalar(portrait ? 0.96 : 0.83)
    this.village.group.position.set(portrait ? -3.5 : 1.25, portrait ? -0.28 : -0.58, portrait ? 1.5 : 3.6)
    this.village.group.updateMatrixWorld()
    this.renderer.shadowMap.needsUpdate = true
    this.titleSmoke = this.village.smoke.map((point) =>
      point.clone().applyMatrix4(this.village.group.matrixWorld),
    )
    this.chase.aspect = aspect
    this.chase.zoom = aspect < 1 ? Math.max(0.63, aspect * 1.04) : 1
    this.chase.updateProjectionMatrix()
    this.ratio = Math.min(this.ratio, this.maxRatio())
    this.renderer.setPixelRatio(this.ratio)
    this.renderer.setSize(this.width, this.height, false)
    this.effects.resize(this.renderer.domElement.height)
    if (!this.air) this.sleigh.rig.scale.setScalar(w * (portrait ? 0.093 : 0.045))
    paintSky(this.sky, this.air)
    this.aurora.material.uniforms.uBase.value = this.air ? 0.157 : portrait ? 0.343 : 0.265
    this.aurora.material.uniforms.uAspect.value = aspect
    this.aurora.material.uniforms.uMoon.value.set(
      portrait ? 0.81 : 0.825,
      this.air ? 0.09 : portrait ? 0.158 : 0.197,
      Math.min(aspect * (portrait ? 0.058 : 0.03), 0.058),
    )
  }
  private maxRatio() {
    return Math.min(window.devicePixelRatio || 1, presets[this.quality].max, 2400 / window.innerWidth)
  }
  setQuality(quality: Quality) {
    this.quality = quality
    const p = presets[quality]
    this.renderer.shadowMap.enabled = !!p.shadow
    if (p.shadow && this.moon.shadow.mapSize.x !== p.shadow) {
      this.moon.shadow.mapSize.set(p.shadow, p.shadow)
      this.moon.shadow.map?.dispose()
      this.moon.shadow.map = null
    }
    this.renderer.shadowMap.needsUpdate = true
    this.effects.quality(p.detail)
    this.ratio = this.maxRatio()
    this.renderer.setPixelRatio(this.ratio)
    this.effects.resize(this.renderer.domElement.height)
    this.fastSeconds = this.slowSeconds = 0
  }
  samplePerformance(fps: number, seconds: number) {
    this.slowSeconds = fps < 51 ? this.slowSeconds + seconds : 0
    this.fastSeconds = fps > 57.5 ? this.fastSeconds + seconds : 0
    const max = this.maxRatio(),
      min = Math.min(max, presets[this.quality].min)
    let ratio = this.ratio
    if (this.slowSeconds >= 1.8) {
      ratio = Math.max(min, ratio * (fps < 38 ? 0.82 : 0.91))
      this.slowSeconds = 0
    }
    if (this.fastSeconds >= 5) {
      ratio = Math.min(max, ratio + 0.06)
      this.fastSeconds = 0
    }
    if (Math.abs(ratio - this.ratio) < 0.008) return
    this.ratio = ratio
    this.renderer.setPixelRatio(ratio)
    this.effects.resize(this.renderer.domElement.height)
  }
  get renderRatio() {
    return this.ratio
  }

  private ensureRoute() {
    if (this.rows.length) return
    for (let i = 0; i < 9; i++) {
      const piece = routeRow(i)
      const ring = targetRing()
      ring.position.y = piece.height + 0.19
      piece.center.add(ring)
      this.route.add(piece.group)
      this.rows.push({ ...piece, ring, status: 'open', mouth: new T.Vector3() })
    }
    const tundra = new T.Mesh(
      new T.PlaneGeometry(280, 220).rotateX(-Math.PI / 2),
      new T.MeshLambertMaterial({ color: '#879fbd' }),
    )
    tundra.position.set(0, -0.24, -64)
    this.route.add(tundra, mountains())
    const colors = [
      ['#cf414b', '#ffdc86'],
      ['#36887a', '#ffe1a0'],
      ['#628abe', '#ffd270'],
    ]
    for (let i = 0; i < 6; i++) {
      const m = new Model(),
        [color, ribbon] = colors[i % colors.length]
      parcel(m, 0, -0.24, 0, 0.52, 0.47, 0.5, color, ribbon)
      const pack = m.finish()
      pack.visible = false
      this.packages.push(pack)
      this.scene.add(pack)
    }
  }

  start(cinematic: boolean) {
    this.ensureRoute()
    this.air = true
    this.camera = this.chase
    this.village.group.visible = false
    this.route.visible = this.cursor.visible = this.line.visible = true
    this.falling.length = 0
    this.settled.length = 0
    this.packages.forEach((p) => {
      p.visible = false
    })
    this.effects.clear()
    this.locked = undefined
    this.cooldown = this.x = this.velocity = this.laneIndex = this.drops = 0
    this.speed = 5.4
    this.rows.forEach((row, i) => {
      if (i < this.rows.length - 2) this.placeRow(row, -9.8 - i * ROW_LENGTH)
      else {
        this.placeRow(row, -9.8 + (i - this.rows.length + 3) * ROW_LENGTH)
        row.status = 'done'
        row.ring.visible = false
      }
    })
    this.sleigh.rig.scale.setScalar(0.78)
    this.chase.position.set(4.9, 14.1, 17.3)
    this.look.set(0, 2.65, -10.3)
    this.chase.lookAt(this.look)
    this.resize()
    this.intro = cinematic ? 0 : null
    if (cinematic)
      this.rows.forEach((row) => {
        row.ring.visible = false
      })
    this.cursor.visible = this.line.visible = !cinematic
    this.animate(0, 0, 0)
  }
  endIntro() {
    this.intro = null
    this.rows.forEach((row) => {
      row.ring.visible = row.status === 'open'
    })
    this.cursor.visible = this.line.visible = true
    this.chase.position.set(4.9, 14.1, 17.3)
    this.look.set(0, 2.65, -10.3)
    this.chase.fov = 51
    this.chase.updateProjectionMatrix()
    this.animate(0, 0, 0)
  }
  cinematic(k: number) {
    this.intro = T.MathUtils.clamp(k, 0, 1)
  }
  menu() {
    this.air = false
    this.intro = null
    this.camera = this.titleCamera
    this.village.group.visible = true
    this.route.visible = this.cursor.visible = this.line.visible = false
    this.falling.length = 0
    this.packages.forEach((p) => {
      p.visible = false
    })
    this.locked = undefined
    this.effects.clear()
    this.resize()
    this.animate(0, 0, 0)
  }
  private placeRow(row: Row, z: number) {
    row.group.position.z = z
    row.center.position.x = flightLanes[this.laneIndex++ % flightLanes.length]
    row.status = 'open'
    row.ring.visible = true
    row.ring.children.forEach((v) => {
      ;(v as T.Mesh).material = amber
    })
    row.mouth.set(row.center.position.x, row.height + 0.06, z)
  }
  private updateAim(elapsed: number) {
    const lead = RELEASE_Z - THROW_LEAD - this.speed * FALL_TIME
    let nearest: Row | undefined
    let dz = Infinity
    for (const row of this.rows) {
      const distance = Math.abs(row.group.position.z - lead)
      if (row.status === 'open' && distance < dz) {
        nearest = row
        dz = distance
      }
    }
    const target =
      nearest && dz < 2.05 - elapsed / 180 && Math.abs(this.x - nearest.center.position.x) < 1.38
        ? nearest
        : undefined
    if (target && target !== this.locked) this.events.lock()
    this.locked = target
    const surface = nearest ? nearest.roofHeight(this.x, lead) : 0
    this.aim.set(this.x, surface + 0.07, lead)
    if (target) this.aim.copy(target.mouth)
    this.aim.y += 0.21
    this.cursor.position.copy(this.aim)
    this.cursor.scale.setScalar(target ? 1.12 + Math.sin(this.time * 9) * 0.08 : 1)
    sightMaterial.color.set(target ? '#a3ffd2' : '#fff5d5')
    for (const row of this.rows) {
      row.ring.rotation.y = this.time * 0.58
      row.ring.scale.setScalar(row === target ? 1.08 : 1)
      row.ring.children.forEach((v) => {
        ;(v as T.Mesh).material = row === target ? mint : amber
      })
    }
    const attr = this.line.geometry.getAttribute('position')
    const dist = this.line.geometry.getAttribute('lineDistance')
    let length = 0
    for (let i = 0; i < attr.count; i++) {
      const k = i / (attr.count - 1)
      attr.setXYZ(
        i,
        T.MathUtils.lerp(this.x, this.aim.x, k),
        T.MathUtils.lerp(ALTITUDE - 0.18, this.aim.y, k * k),
        T.MathUtils.lerp(RELEASE_Z, this.aim.z, k),
      )
      if (i)
        length += Math.hypot(
          attr.getX(i) - attr.getX(i - 1),
          attr.getY(i) - attr.getY(i - 1),
          attr.getZ(i) - attr.getZ(i - 1),
        )
      dist.setX(i, length)
    }
    attr.needsUpdate = true
    dist.needsUpdate = true
    this.line.material.color.set(target ? '#a6ffd3' : '#ffedbb')
  }
  drop() {
    if (!this.air || this.cooldown > 0) return false
    const pack = this.packages[this.drops++ % this.packages.length]
    this.settled = this.settled.filter((s) => s.object !== pack)
    const start = new T.Vector3(this.x, ALTITUDE + 0.09, RELEASE_Z)
    const target = this.locked
    if (target) {
      target.status = 'pending'
      this.locked = undefined
    }
    pack.visible = true
    pack.position.copy(start)
    pack.rotation.set(0.12, 0, 0.05)
    this.falling.push({
      object: pack,
      start,
      age: 0,
      target,
      end: new T.Vector3(this.x, Math.max(0.23, this.aim.y), RELEASE_Z - THROW_LEAD),
    })
    this.cooldown = 0.39
    return true
  }
  get hasFalling() {
    return this.falling.length > 0
  }
  get onTarget() {
    return !!this.locked
  }
  aimPosition() {
    return this.screen(this.aim)
  }
  screen(position: T.Vector3) {
    this.point.copy(position).project(this.camera)
    return { x: ((this.point.x + 1) * this.width) / 2, y: ((1 - this.point.y) * this.height) / 2 }
  }
  private advance(dt: number, elapsed: number, steer: number) {
    this.speed = 5.4 + elapsed * 0.105
    this.cooldown = Math.max(0, this.cooldown - dt)
    this.velocity = T.MathUtils.damp(this.velocity, steer * 10.6, steer ? 10.8 : 15.8, dt)
    this.x = T.MathUtils.clamp(this.x + this.velocity * dt, -6.15, 6.15)
    this.smokePoints.length = 0
    for (const row of this.rows) {
      row.group.position.z += this.speed * dt
      if (row.group.position.z > 17.2)
        this.placeRow(row, row.group.position.z - this.rows.length * ROW_LENGTH)
      row.mouth.z = row.group.position.z
      if (row.mouth.z > -36 && row.mouth.z < 12) this.smokePoints.push(row.mouth)
    }
    for (let i = this.falling.length - 1; i >= 0; i--) {
      const d = this.falling[i]
      const k = Math.min(1, (d.age += dt) / FALL_TIME)
      const dest = d.target?.mouth ?? d.end
      d.object.position.set(
        T.MathUtils.lerp(d.start.x, dest.x, k),
        T.MathUtils.lerp(d.start.y, dest.y, k * k),
        T.MathUtils.lerp(d.start.z, dest.z, k),
      )
      d.object.rotation.y += dt * 3.8
      d.object.rotation.z = Math.sin(k * Math.PI * 2) * 0.15
      if (k < 1) continue
      if (d.target) {
        d.object.visible = false
        d.target.status = 'done'
        d.target.ring.visible = false
        this.effects.celebrate(dest.x, dest.y, dest.z)
      } else this.settled.push({ object: d.object, height: dest.y, age: 0 })
      this.events.delivered(!!d.target, dest)
      this.falling.splice(i, 1)
    }
    for (let i = this.settled.length - 1; i >= 0; i--) {
      const s = this.settled[i]
      s.age += dt
      s.object.position.z += this.speed * dt
      s.object.position.y = s.height + Math.max(0, Math.sin(Math.min(1, s.age / 0.25) * Math.PI)) * 0.11
      if (s.age > 2.1) {
        s.object.visible = false
        this.settled.splice(i, 1)
      }
    }
    const rig = this.sleigh.rig
    rig.position.set(this.x, ALTITUDE + Math.sin(this.time * 2.4) * 0.075, RELEASE_Z - 0.15)
    rig.rotation.set(
      -this.velocity * 0.017,
      Math.PI / 2 - this.velocity * 0.012,
      Math.sin(this.time * 1.7) * 0.013,
      'YXZ',
    )
    const follow = this.width / this.height < 0.85 ? 0.77 : 0.41
    this.chase.position.x = T.MathUtils.damp(this.chase.position.x, 4.9 + this.x * follow, 3.3, dt)
    this.chase.position.y = T.MathUtils.damp(
      this.chase.position.y,
      14.1 + Math.abs(this.velocity) * 0.038,
      2.4,
      dt,
    )
    this.look.x = T.MathUtils.damp(this.look.x, this.x * follow, 4, dt)
    this.chase.lookAt(this.look)
    this.chase.updateMatrixWorld()
    this.updateAim(elapsed)
  }
  animate(dt: number, elapsed: number, steer: number) {
    this.time += dt
    const rig = this.sleigh.rig
    this.aurora.material.uniforms.uTime.value = this.time
    this.aurora.material.uniforms.uDrift.value = this.air ? this.chase.position.x * 0.003 : 0
    if (this.intro !== null) {
      const k = this.intro * this.intro * (3 - 2 * this.intro)
      introPath.getPoint(k, this.chase.position)
      introLook.getPoint(k, this.look)
      this.chase.lookAt(this.look)
      this.chase.fov = 51 + 9 * Math.sin(k * Math.PI)
      this.chase.updateProjectionMatrix()
      this.chase.updateMatrixWorld()
      rig.position.set(
        0,
        ALTITUDE + Math.sin(this.time * 2.4) * 0.075 - (1 - k) * 0.8,
        RELEASE_Z - 0.15 + (1 - k) * 5.6,
      )
      rig.rotation.set(0, Math.PI / 2, 0, 'YXZ')
      this.smokePoints = this.rows.slice(0, 6).map((r) => r.mouth)
    } else if (this.air) this.advance(dt, elapsed, steer)
    else {
      rig.position.copy(this.home)
      rig.position.y += Math.sin(this.time * 1.27) * 0.088
      rig.rotation.set(
        0.01,
        -0.27 + Math.sin(this.time * 0.43) * 0.024,
        0.088 + Math.sin(this.time * 0.97) * 0.013,
        'YXZ',
      )
    }
    this.sleigh.animate(this.time)
    this.anchor
      .set(-1.75, 0.18, 0)
      .applyQuaternion(rig.quaternion)
      .multiplyScalar(rig.scale.x)
      .add(rig.position)
    this.trailClock += dt
    while (this.trailClock >= 0.045) {
      this.trailClock -= 0.045
      this.effects.trail(this.anchor, this.air)
    }
    this.effects.animate(
      dt,
      this.time,
      this.air && this.intro === null ? this.speed : 0,
      this.air ? this.smokePoints : this.titleSmoke,
    )
  }
  render() {
    if (this.air && (this.quality === 'high' || this.frames % 2 === 0))
      this.renderer.shadowMap.needsUpdate = true
    this.frames++
    this.renderer.render(this.scene, this.camera)
  }
}
