import * as T from 'three'
import { haloTexture, random, silhouette } from './model'

const vertex = `
attribute float aSize;
attribute float aAlpha;
attribute vec3 aTint;
uniform float uHeight;
varying vec3 tint;
varying float alpha;
void main() {
  vec4 eye = modelViewMatrix * vec4(position, 1.);
  gl_Position = projectionMatrix * eye;
  gl_PointSize = clamp(aSize * uHeight * projectionMatrix[1][1] / max(0.01, gl_Position.w), 1., 80.);
  tint = aTint; alpha = aAlpha;
}`

const fragments = {
  sparkle:
    'float d = abs(p.x) + abs(p.y); float rays = min(abs(p.x),abs(p.y)); if (d > .96 || (rays > .19 && d > .42)) discard; float a = 1. - smoothstep(.50,1.,d);',
  snow: 'float d = max(abs(p.x),abs(p.y)); if (dot(p,p) > 1.) discard; float a = 1. - .28*d;',
  smoke: 'float d = length(p); if (d > 1.) discard; float a = (1. - smoothstep(.45,1.,d)) * (1. - .3*d);',
}

class PointCloud {
  geometry = new T.BufferGeometry()
  positions: Float32Array
  sizes: Float32Array
  opacities: Float32Array
  tints: Float32Array
  material: T.ShaderMaterial
  mesh: T.Points
  constructor(count: number, style: keyof typeof fragments) {
    this.positions = new Float32Array(count * 3)
    this.sizes = new Float32Array(count)
    this.opacities = new Float32Array(count)
    this.tints = new Float32Array(count * 3)
    this.geometry.setAttribute(
      'position',
      new T.BufferAttribute(this.positions, 3).setUsage(T.DynamicDrawUsage),
    )
    this.geometry.setAttribute('aSize', new T.BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute('aAlpha', new T.BufferAttribute(this.opacities, 1))
    this.geometry.setAttribute('aTint', new T.BufferAttribute(this.tints, 3))
    this.material = new T.ShaderMaterial({
      uniforms: { uHeight: { value: 600 } },
      vertexShader: vertex,
      fragmentShader: `varying vec3 tint; varying float alpha;
      void main(){ vec2 p=gl_PointCoord*2.-1.; ${fragments[style]} gl_FragColor=vec4(tint,alpha*a);
      #include <colorspace_fragment>
      }`,
      transparent: true,
      depthWrite: false,
      blending: style === 'sparkle' ? T.AdditiveBlending : T.NormalBlending,
    })
    this.mesh = new T.Points(this.geometry, this.material)
    this.mesh.frustumCulled = false
    this.mesh.renderOrder = style === 'smoke' ? 1 : 3
  }
  sync(all = false) {
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.aAlpha.needsUpdate = true
    if (all) {
      this.geometry.attributes.aTint.needsUpdate = true
      this.geometry.attributes.aSize.needsUpdate = true
    }
  }
}

const colors = ['#ffd179', '#fff1be', '#ef7664', '#9ce7cc'].map((v) => new T.Color(v))
const starShape = silhouette(
  Array.from({ length: 10 }, (_, i) => {
    const a = Math.PI / 2 + (i * Math.PI) / 5,
      r = i % 2 ? 0.46 : 1
    return [Math.cos(a) * r, Math.sin(a) * r]
  }),
  0.22,
  0.035,
)
type Celebration = { group: T.Group; wave: T.Mesh; star: T.Mesh; glow: T.Sprite; age: number }
type Foil = { p: T.Vector3; v: T.Vector3; age: number; spin: number; tint: number }
export class Effects {
  private flakes = new PointCloud(360, 'snow')
  private sparks = new PointCloud(215, 'sparkle')
  private smoke = new PointCloud(130, 'smoke')
  private velocities = new Float32Array(215 * 3)
  private life = new Float32Array(215)
  private duration = new Float32Array(215)
  private gravity = new Float32Array(215)
  private index = 0
  private rand = random(24521)
  private sparkLimit = 215
  private plumeCount = 6
  private detail = 2
  private celebrations: Celebration[] = []
  private nextBurst = 0
  private flash = new T.PointLight('#ffb566', 0, 9, 2)
  private foil = new T.InstancedMesh(
    new T.BoxGeometry(0.075, 0.16, 0.037),
    new T.MeshBasicMaterial({ color: '#ffffff' }),
    80,
  )
  private pieces: Foil[] = []
  private matrix = new T.Object3D()
  constructor(scene: T.Scene) {
    scene.add(this.flakes.mesh, this.smoke.mesh, this.sparks.mesh, this.flash, this.foil)
    this.foil.count = 0
    this.foil.frustumCulled = false
    this.foil.instanceMatrix.setUsage(T.DynamicDrawUsage)
    const waveGeo = new T.TorusGeometry(1, 0.042, 5, 42).rotateX(Math.PI / 2)
    const starMat = new T.MeshStandardMaterial({
      color: '#ffd77c',
      emissive: '#e29738',
      emissiveIntensity: 0.48,
      roughness: 0.37,
      metalness: 0.34,
    })
    for (let i = 0; i < 3; i++) {
      const group = new T.Group()
      const wave = new T.Mesh(
        waveGeo,
        new T.MeshBasicMaterial({ color: '#c5ffcb', transparent: true, depthWrite: false }),
      )
      const star = new T.Mesh(starShape, starMat)
      const glow = new T.Sprite(
        new T.SpriteMaterial({
          map: haloTexture,
          color: '#ffbd62',
          transparent: true,
          depthWrite: false,
          blending: T.AdditiveBlending,
        }),
      )
      group.add(wave, star, glow)
      group.visible = false
      scene.add(group)
      this.celebrations.push({ group, wave, star, glow, age: 2 })
    }
    for (let i = 0; i < this.flakes.sizes.length; i++) {
      this.flakes.positions.set([(this.rand() - 0.5) * 44, this.rand() * 19, -46 + this.rand() * 65], i * 3)
      this.flakes.sizes[i] = 0.027 + this.rand() ** 2 * 0.069
      this.flakes.opacities[i] = 0.28 + this.rand() * 0.54
      this.flakes.tints.set([0.79, 0.88, 0.98], i * 3)
    }
    for (let i = 0; i < this.smoke.sizes.length; i++) this.smoke.tints.set([0.41, 0.48, 0.57], i * 3)
  }
  resize(height: number) {
    for (const cloud of [this.flakes, this.sparks, this.smoke]) cloud.material.uniforms.uHeight.value = height
  }
  quality(detail: number) {
    this.detail = detail
    this.sparkLimit = [90, 155, 215][detail]
    this.plumeCount = [3, 5, 6][detail]
    this.flakes.geometry.setDrawRange(0, [140, 250, 360][detail])
    this.sparks.geometry.setDrawRange(0, this.sparkLimit)
  }
  clear() {
    this.life.fill(0)
    this.sparks.opacities.fill(0)
    this.sparks.sync()
    this.pieces.length = 0
    this.foil.count = 0
    this.flash.intensity = 0
    this.celebrations.forEach((b) => {
      b.group.visible = false
      b.age = 2
    })
  }
  emit(
    x: number,
    y: number,
    z: number,
    vx: number,
    vy: number,
    vz: number,
    size: number,
    seconds: number,
    color: number,
    gravity = 0,
  ) {
    const i = this.index++ % this.sparkLimit
    this.sparks.positions.set([x, y, z], i * 3)
    this.velocities.set([vx, vy, vz], i * 3)
    this.sparks.tints.set(colors[color].toArray(), i * 3)
    this.sparks.sizes[i] = size
    this.duration[i] = this.life[i] = seconds
    this.gravity[i] = gravity
  }
  celebrate(x: number, y: number, z: number) {
    const burst = this.celebrations[this.nextBurst++ % this.celebrations.length]
    burst.age = 0
    burst.group.position.set(x, y, z)
    burst.group.visible = true
    this.flash.position.set(x, y + 0.9, z)
    this.flash.intensity = this.detail ? 14 : 0
    for (let i = 0; i < 24 + this.detail * 10; i++) {
      const a = this.rand() * Math.PI * 2,
        r = this.rand() * 2.5 + 0.5
      this.emit(
        x,
        y + 0.12,
        z,
        Math.cos(a) * r,
        1.2 + this.rand() * 3.2,
        Math.sin(a) * r,
        0.075 + this.rand() * 0.18,
        0.38 + this.rand() * 0.55,
        i % 4,
        5.4,
      )
    }
    for (let i = 0; i < 9 + this.detail * 7; i++) {
      const a = this.rand() * Math.PI * 2,
        r = 0.8 + this.rand() * 1.9
      this.pieces.push({
        p: new T.Vector3(x, y + 0.15, z),
        v: new T.Vector3(Math.cos(a) * r, 2 + this.rand() * 2.6, Math.sin(a) * r),
        age: 0,
        spin: this.rand() * 8,
        tint: i % 4,
      })
    }
  }
  trail(anchor: T.Vector3, inGame: boolean) {
    const r = this.rand
    this.emit(
      anchor.x + (r() - 0.5) * 0.32,
      anchor.y + (r() - 0.5) * 0.22,
      anchor.z + (r() - 0.5) * 0.28,
      inGame ? (r() - 0.5) * 0.55 : -2.1 - r() * 1.2,
      -0.2 - r() * 0.4,
      inGame ? 2.7 + r() : (r() - 0.5) * 0.48,
      0.05 + r() ** 2 * 0.13,
      0.6 + r() * 0.84,
      r() < 0.65 ? 0 : 1,
    )
  }
  animate(dt: number, t: number, wind: number, chimneys: T.Vector3[]) {
    this.flash.intensity = Math.max(0, this.flash.intensity - dt * 24)
    this.flash.position.z += dt * wind
    for (const burst of this.celebrations) {
      if (!burst.group.visible) continue
      const k = (burst.age += dt) / 0.95
      if (k >= 1) {
        burst.group.visible = false
        continue
      }
      burst.group.position.z += wind * dt
      burst.wave.scale.setScalar(0.42 + k * 2.2)
      burst.wave.position.y = 0.14 + k * 0.52
      ;(burst.wave.material as T.MeshBasicMaterial).opacity = (1 - k) ** 1.6
      burst.star.position.y = 0.28 + (1 - (1 - k) ** 2) * 1.95
      burst.star.scale.setScalar(Math.sin(Math.PI * k) ** 0.5 * 0.47)
      burst.star.rotation.set(-0.2, k * 4.4, Math.sin(k * 6) * 0.19)
      burst.glow.position.y = burst.star.position.y
      burst.glow.scale.setScalar(3.0 + k * 1.3)
      burst.glow.material.opacity = Math.sin(Math.PI * k) * 0.72
    }
    let count = 0
    for (let i = this.pieces.length - 1; i >= 0; i--) {
      const f = this.pieces[i],
        k = (f.age += dt) / 0.91
      if (k >= 1) {
        this.pieces.splice(i, 1)
        continue
      }
      f.v.y -= 6 * dt
      f.p.addScaledVector(f.v, dt)
      f.p.z += dt * wind
      if (count >= 80) continue
      this.matrix.position.copy(f.p)
      this.matrix.rotation.set(f.spin + k * 6, k * (f.spin + 4), f.spin - k * 7)
      this.matrix.scale.setScalar(Math.min(1, (1 - k) * 3))
      this.matrix.updateMatrix()
      this.foil.setMatrixAt(count, this.matrix.matrix)
      this.foil.setColorAt(count++, colors[f.tint])
    }
    this.foil.count = count
    if (count) {
      this.foil.instanceMatrix.needsUpdate = true
      this.foil.instanceColor!.needsUpdate = true
    }
    const pos = this.flakes.positions
    for (let i = 0; i < this.flakes.sizes.length; i++) {
      const n = i * 3
      pos[n] -= (0.12 + Math.sin(t * 0.52 + i) * 0.22) * dt
      pos[n + 1] -= (0.3 + this.flakes.sizes[i] * 7.7) * dt
      pos[n + 2] += (wind + 0.13) * dt
      if (pos[n + 1] < 0) pos[n + 1] += 19
      if (pos[n] < -22) pos[n] += 44
      if (pos[n + 2] > 19) pos[n + 2] -= 65
    }
    this.flakes.sync()
    for (let i = 0; i < this.life.length; i++) {
      if (this.life[i] <= 0) continue
      this.life[i] = Math.max(0, this.life[i] - dt)
      this.sparks.opacities[i] = Math.min(1, (this.life[i] / this.duration[i]) * 1.8)
      const n = i * 3
      this.velocities[n + 1] -= this.gravity[i] * dt
      for (let j = 0; j < 3; j++) this.sparks.positions[n + j] += this.velocities[n + j] * dt
      if (this.gravity[i]) this.sparks.positions[n + 2] += wind * dt
    }
    this.sparks.sync(true)
    let used = 0
    for (let j = 0; j < chimneys.length; j++) {
      const mouth = chimneys[j]
      for (let k = 0; k < this.plumeCount; k++) {
        if (used >= this.smoke.sizes.length) break
        const phase = (t * 0.24 + k / this.plumeCount + j * 0.123) % 1
        const n = used * 3
        this.smoke.positions[n] = mouth.x + 0.57 * phase ** 1.5 + Math.sin(phase * 7 + j) * phase * 0.11
        this.smoke.positions[n + 1] = mouth.y + phase * 1.85
        this.smoke.positions[n + 2] = mouth.z + phase * 0.15
        this.smoke.sizes[used] = 0.16 + phase * 0.57
        this.smoke.opacities[used++] = Math.sin(phase * Math.PI) * 0.24
      }
    }
    this.smoke.geometry.setDrawRange(0, used)
    this.smoke.sync(true)
  }
}
