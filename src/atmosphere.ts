import * as T from 'three'
import { random } from './model'

/** A tiny sky reflection map supplies cold sky and warm horizon highlights on the lacquer and brass. */
export function lightMap() {
  const w = 128,
    h = 64,
    data = new Uint8Array(w * h * 4),
    c = new T.Color()
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const u = x / w,
        v = y / h
      const snow = Math.max(0, (0.54 - v) * 2.5)
      const aurora = Math.exp(-(((v - 0.67 - Math.sin(u * 9) * 0.08) / 0.11) ** 2))
      const warm = Math.exp(-(((u - 0.64) / 0.11) ** 2 + ((v - 0.48) / 0.09) ** 2))
      c.setRGB(
        0.1 + snow * 0.4 + warm * 0.98,
        0.16 + snow * 0.47 + aurora * 0.31 + warm * 0.48,
        0.28 + snow * 0.56 + aurora * 0.23,
      )
      c.convertLinearToSRGB()
      data.set(
        [Math.min(255, c.r * 255), Math.min(255, c.g * 255), Math.min(255, c.b * 255), 255],
        (y * w + x) * 4,
      )
    }
  const texture = new T.DataTexture(data, w, h)
  texture.colorSpace = T.SRGBColorSpace
  texture.mapping = T.EquirectangularReflectionMapping
  texture.magFilter = texture.minFilter = T.LinearFilter
  texture.needsUpdate = true
  return texture
}

export function northernLights() {
  const material = new T.ShaderMaterial({
    transparent: true,
    depthTest: true,
    depthWrite: false,
    fog: false,
    uniforms: {
      uTime: { value: 0 },
      uBase: { value: 0.28 },
      uDrift: { value: 0 },
      uMoon: { value: new T.Vector3() },
      uAspect: { value: 1 },
    },
    vertexShader: `varying vec2 vUv;
    void main(){vUv=uv; gl_Position=vec4(position.xy, .99999, 1.);}`,
    fragmentShader: `varying vec2 vUv;
    uniform float uTime; uniform float uBase; uniform float uDrift; uniform vec3 uMoon; uniform float uAspect;
    void main(){
      float y=1.-vUv.y;
      if(y>uBase+.19 || y<uBase-.28) discard;
      float x=vUv.x+uDrift, t=uTime*.105;
      float hem=uBase+.055*sin(x*7.2+t*.75)+.034*sin(x*15.6-t*.42)+.016*sin(x*23.+t);
      float d=hem-y;
      float ray=.66+.18*sin(x*216.+3.*sin(x*19.+t))+.11*sin(x*426.-t*2.)+.05*sin(x*839.+t);
      float plume=exp(-abs(d)*mix(17.,92.,step(d,0.))) * ray;
      float edge=exp(-abs(d)*140.)*.26;
      float ripple=.64+.34*sin(x*8.+t*.64);
      float second=exp(-abs(d-.047-.023*sin(x*17.-t))*42.);
      vec3 color=mix(vec3(.11,.83,.55),vec3(.16,.49,.81),smoothstep(.0,.15,d)+.2*sin(x*6.));
      color=mix(color,vec3(.48,.36,.74),second*.40);
      float a=(plume*.42+edge+second*.12)*ripple;
      float moon=length((vec2(vUv.x,y)-uMoon.xy)*vec2(uAspect,1.));
      gl_FragColor=vec4(color,clamp(a,0.,.54)*smoothstep(uMoon.z*.98,uMoon.z*1.35,moon));
    }`,
  })
  const mesh = new T.Mesh(new T.PlaneGeometry(2, 2), material)
  mesh.frustumCulled = false
  mesh.renderOrder = -100
  return { mesh, material }
}

/** Two continuous mountain ranges surround the route, including the ground-level fly-through. */
export function mountains() {
  const rnd = random(18942),
    p: number[] = [],
    colors: number[] = []
  type P = [number, number, number]
  function face(a: P, b: P, c: P, color: string, shade: number) {
    p.push(...a, ...b, ...c)
    const tint = new T.Color(color).multiplyScalar(shade)
    for (let i = 0; i < 3; i++) colors.push(tint.r, tint.g, tint.b)
  }
  const point = (a: number, r: number, h: number): P => [Math.sin(a) * r, h, -11 + Math.cos(a) * r]
  for (let layer = 0; layer < 2; layer++) {
    const n = layer ? 110 : 90,
      radius = layer ? 83 : 115,
      phase = layer ? 0.28 : 0
    const crests: P[] = [],
      edges: P[] = [],
      foothills: P[] = [],
      bases: P[] = []
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + phase
      const peak = 0.5 + 0.5 * Math.cos(a * 24 + 0.78 * Math.sin(a * 7))
      const h = layer
        ? 2.1 + 3.2 * (0.5 + 0.5 * Math.sin(a * 11)) + rnd() * 1.3
        : 4.5 + peak * (5.5 + 4.6 * Math.cos(a * 4) ** 2) + 2.7 * Math.sin(a * 5) + rnd() * 2.4
      crests.push(point(a, radius + rnd() * 4, h))
      edges.push(point(a + 0.005 * (rnd() - 0.5), radius - 4 - rnd() * 4, h * (0.61 + rnd() * 0.19)))
      foothills.push(point(a, radius - 13 - rnd() * 5, h * 0.3))
      bases.push(point(a, radius - 22, -2.9))
    }
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n,
        light = 0.86 + rnd() * 0.2
      face(crests[i], edges[i], crests[j], layer ? '#657f96' : '#bdccdb', light)
      face(crests[j], edges[i], edges[j], layer ? '#637d95' : '#95aec7', light)
      face(edges[i], foothills[i], edges[j], layer ? '#6a8399' : '#7793ac', light)
      face(edges[j], foothills[i], foothills[j], layer ? '#698299' : '#627e9b', light)
      face(foothills[i], bases[i], foothills[j], '#718ba4', light)
      face(foothills[j], bases[i], bases[j], '#708aa3', light)
    }
    if (layer)
      for (let i = 0; i < 540; i++) {
        const a = rnd() * Math.PI * 2,
          idx = (a / (Math.PI * 2)) * n,
          k = Math.floor(idx),
          f = idx - k
        const u = foothills[k],
          v = foothills[(k + 1) % n],
          x = T.MathUtils.lerp(u[0], v[0], f),
          z = T.MathUtils.lerp(u[2], v[2], f)
        const y = T.MathUtils.lerp(u[1], v[1], f),
          scale = 0.45 + rnd() * 0.78
        const dx = Math.cos(a) * scale,
          dz = -Math.sin(a) * scale
        face(
          [x - dx, y, z - dz],
          [x, y + 2.8 * scale, z],
          [x + dx, y, z + dz],
          '#59778d',
          0.93 + rnd() * 0.12,
        )
      }
  }
  const g = new T.BufferGeometry()
  g.setAttribute('position', new T.Float32BufferAttribute(p, 3))
  g.setAttribute('color', new T.Float32BufferAttribute(colors, 3))
  return new T.Mesh(g, new T.MeshBasicMaterial({ vertexColors: true, side: T.DoubleSide, fog: false }))
}
