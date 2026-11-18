import './style.css'
import { World, type Quality } from './world'
import { paintIcon } from './icons'
import { paintSky } from './sky'
import { SleighBells } from './audio'

type Mode = 'menu' | 'intro' | 'playing' | 'finishing' | 'results'
type Modal = 'guide' | 'pause' | 'settings'
const find = <E extends HTMLElement = HTMLElement>(id: string) => document.getElementById(id) as E
const pad = (n: number) => String(n).padStart(6, '0')
const store = {
  read(key: string) {
    try {
      return localStorage.getItem('santa-express.' + key)
    } catch {
      return null
    }
  },
  write(key: string, value: string) {
    try {
      localStorage.setItem('santa-express.' + key, value)
    } catch {
      /* Session play still works. */
    }
  },
}
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const coarse = window.matchMedia('(pointer: coarse)')
const sound = new SleighBells(store.read('sound') !== 'off')
function readBest() {
  return Math.max(0, Number.parseInt(store.read('best') ?? '0', 10) || 0)
}
let best = readBest()
let world: World | undefined
let mode: Mode = 'menu',
  elapsed = 0,
  score = 0,
  deliveries = 0,
  streak = 0,
  longest = 0
let previousTick = 60,
  lastFrame = performance.now(),
  tipUntil = 0
let introElapsed = 0,
  frameCount = 0,
  sampleTime = 0
const savedQuality = store.read('quality')
let quality: Quality = savedQuality === 'low' || savedQuality === 'high' ? savedQuality : 'medium'
let fpsVisible = store.read('fps') === 'on'
const pressed = new Set<string>(),
  touch = new Set<number>()
const menu = find('menu'),
  results = find('results'),
  hud = find('hud'),
  timer = find('time')
const hint = find('lock-hint'),
  tip = find('flight-tip'),
  announcer = find('announcer')
const dialog = find<HTMLDialogElement>('dialog'),
  closeDialog = find<HTMLButtonElement>('dialog-action')
const playButton = find<HTMLButtonElement>('start'),
  sceneCanvas = find<HTMLCanvasElement>('world')
document.querySelectorAll<HTMLElement>('[data-icon]').forEach((el) => paintIcon(el, el.dataset.icon!))
find('best').textContent = pad(best)

function clearSteering() {
  pressed.clear()
  touch.clear()
}
function refreshSound() {
  const label = sound.enabled ? 'Mute sound' : 'Enable sound'
  const button = find('sound')
  button.setAttribute('aria-label', label)
  button.setAttribute('aria-pressed', String(sound.enabled))
  button.title = label + ' (M)'
  paintIcon(find('speaker'), sound.enabled ? 'sound' : 'mute')
}
function toggleSound() {
  sound.enabled = !sound.enabled
  store.write('sound', sound.enabled ? 'on' : 'off')
  sound.unlock()
  if (sound.enabled) sound.lock()
  refreshSound()
}
refreshSound()

function setMode(next: Mode) {
  mode = next
  const inFlight = next === 'playing' || next === 'finishing'
  document.body.dataset.mode = inFlight ? 'playing' : next
  menu.hidden = next !== 'menu'
  results.hidden = next !== 'results'
  hud.hidden = !inFlight
  find('pause').hidden = next !== 'playing'
  find('touch-controls').hidden = next !== 'playing'
  find('skip-intro').hidden = next !== 'intro'
  hint.hidden = tip.hidden = true
  clearSteering()
}
function updateScore() {
  find('score').textContent = pad(score)
  find('combo').textContent = '×' + Math.min(5, Math.max(1, streak))
}
function updateTime() {
  const seconds = Math.max(0, Math.ceil(60 - elapsed))
  if (seconds === previousTick) return
  timer.textContent = seconds === 60 ? '1:00' : '0:' + String(seconds).padStart(2, '0')
  timer.parentElement!.classList.toggle('urgent', seconds <= 10)
  if (seconds <= 5 && seconds > 0 && seconds < previousTick) sound.tick()
  previousTick = seconds
}
function startRound() {
  if (!world || dialog.open) return
  const cinematic = mode === 'menu' && !reducedMotion.matches
  sound.unlock()
  score = deliveries = streak = longest = elapsed = 0
  previousTick = -1
  tipUntil = 8
  find('feedback').replaceChildren()
  find('share').textContent = 'Copy score'
  find('share-text').hidden = true
  announcer.textContent = 'Flight started. Aim for the glowing chimney rings.'
  setMode(cinematic ? 'intro' : 'playing')
  updateScore()
  updateTime()
  world.start(cinematic)
  introElapsed = frameCount = sampleTime = 0
  lastFrame = performance.now()
  sceneCanvas.focus({ preventScroll: true })
  sound.start()
}
function launch() {
  if (mode !== 'intro' || !world) return
  world.endIntro()
  setMode('playing')
  lastFrame = performance.now()
  sceneCanvas.focus({ preventScroll: true })
}
function finishRound() {
  if (!world) return
  best = Math.max(best, readBest())
  const record = score > best
  if (record) {
    best = score
    store.write('best', String(best))
  }
  find('best').textContent = pad(best)
  find('final-score').textContent = score.toLocaleString('en-US')
  find('record').hidden = !record
  find('delivered').textContent = String(deliveries)
  find('streak').textContent = String(longest)
  find('feedback').replaceChildren()
  setMode('results')
  world.menu()
  sound.finish()
  announcer.textContent = `Route complete. ${score} points. ${deliveries} gifts delivered.`
  find<HTMLButtonElement>('replay').focus({ preventScroll: true })
}
function openModal(kind: Modal) {
  if (dialog.open || mode === 'finishing') return
  clearSteering()
  hint.hidden = tip.hidden = true
  const guide = kind === 'guide',
    settings = kind === 'settings'
  find('dialog-title').textContent = settings ? 'Graphics settings' : guide ? 'Flight guide' : 'Flight paused'
  find('guide-content').hidden = !guide
  find('settings-content').hidden = !settings
  find('pause-copy').hidden = kind !== 'pause'
  closeDialog.textContent =
    mode === 'playing' ? 'Resume flight' : mode === 'intro' ? 'Resume intro' : settings ? 'Done' : 'Got it'
  dialog.showModal()
  closeDialog.focus({ preventScroll: true })
}
function dismiss() {
  if (!dialog.open) return
  dialog.close()
  lastFrame = performance.now()
  if (mode === 'playing' || mode === 'intro') sceneCanvas.focus({ preventScroll: true })
}
function drop() {
  if (mode === 'playing' && !dialog.open && world?.drop()) {
    sound.unlock()
    sound.drop()
    hint.hidden = true
  }
}

find('sound').addEventListener('click', () => {
  toggleSound()
  if (mode === 'playing') sceneCanvas.focus({ preventScroll: true })
})
find('skip-intro').addEventListener('click', launch)
find('settings').addEventListener('click', () => openModal('settings'))
function settingsView() {
  document.querySelector<HTMLInputElement>(`input[name="quality"][value="${quality}"]`)!.checked = true
  find<HTMLInputElement>('show-fps').checked = fpsVisible
  find('fps').hidden = !fpsVisible
  find('quality-info').textContent = {
    low: 'Baked lighting and fewer snowflakes give older graphics chips more headroom.',
    medium: 'Soft shadows and moderate snowfall balance detail and frame rate.',
    high: 'Sharper shadows, denser snowfall and more celebration effects.',
  }[quality]
}
document.querySelectorAll<HTMLInputElement>('input[name="quality"]').forEach((radio) =>
  radio.addEventListener('change', () => {
    quality = radio.value as Quality
    store.write('quality', quality)
    world?.setQuality(quality)
    world?.render()
    settingsView()
  }),
)
find('show-fps').addEventListener('change', () => {
  fpsVisible = find<HTMLInputElement>('show-fps').checked
  store.write('fps', fpsVisible ? 'on' : 'off')
  settingsView()
})
settingsView()
playButton.addEventListener('click', startRound)
find('replay').addEventListener('click', startRound)
find('pause').addEventListener('click', () => openModal('pause'))
find('guide').addEventListener('click', () => openModal('guide'))
find('home').addEventListener('click', () => {
  setMode('menu')
  playButton.focus({ preventScroll: true })
})
closeDialog.addEventListener('click', dismiss)
find('close-dialog').addEventListener('click', dismiss)
dialog.addEventListener('cancel', (e) => {
  e.preventDefault()
  dismiss()
})
dialog.addEventListener('click', (e) => {
  if (e.target === dialog) dismiss()
})
find('share').addEventListener('click', async () => {
  const url = new URL('./', window.location.href).href
  const message = `I delivered ${deliveries} ${deliveries === 1 ? 'gift' : 'gifts'} for ${score.toLocaleString('en-US')} points in Santa Express: Chimney Panic! Can you beat my score? ${url}`
  const box = find<HTMLTextAreaElement>('share-text')
  let copied = false
  try {
    await navigator.clipboard.writeText(message)
    copied = true
  } catch {
    box.hidden = false
    box.value = message
    box.select()
    try {
      copied = document.execCommand('copy')
    } catch {
      /* Leave the selected text available. */
    }
  }
  box.hidden = copied
  find('share').textContent = copied ? 'Copied!' : 'Select & copy'
  announcer.textContent = copied ? 'Score copied to clipboard.' : 'Select the score text and copy it.'
})

const movement = ['KeyA', 'KeyD', 'ArrowLeft', 'ArrowRight']
window.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || e.target instanceof HTMLTextAreaElement) return
  if (dialog.open) return
  if (e.code === 'KeyM' && !e.repeat) {
    toggleSound()
    return
  }
  if (mode === 'intro' && ['Enter', 'Space', 'Escape'].includes(e.code) && !e.repeat) {
    e.preventDefault()
    launch()
    return
  }
  if (mode === 'playing') {
    if (movement.includes(e.code)) {
      e.preventDefault()
      pressed.add(e.code)
    }
    if (e.code === 'Space') {
      if (e.target instanceof HTMLButtonElement) return
      e.preventDefault()
      if (!e.repeat) drop()
    }
    if ((e.code === 'Escape' || e.code === 'KeyP') && !e.repeat) {
      e.preventDefault()
      openModal('pause')
    }
  } else if (
    (mode === 'menu' || mode === 'results') &&
    e.code === 'Enter' &&
    !e.repeat &&
    !(e.target instanceof HTMLButtonElement)
  ) {
    e.preventDefault()
    startRound()
  }
})
window.addEventListener('keyup', (e) => pressed.delete(e.code))
function pauseOnLeave() {
  clearSteering()
  if (mode === 'playing' || mode === 'intro') openModal('pause')
}
window.addEventListener('storage', (e) => {
  if (e.key === 'santa-express.best') {
    best = Math.max(best, readBest())
    find('best').textContent = pad(best)
  }
})
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pauseOnLeave()
  lastFrame = performance.now()
})
window.addEventListener('blur', pauseOnLeave)
for (const [id, side] of [
  ['left', -1],
  ['right', 1],
] as const) {
  const button = find(id)
  button.addEventListener('pointerdown', (e) => {
    e.preventDefault()
    button.setPointerCapture(e.pointerId)
    touch.add(side)
  })
  button.addEventListener('lostpointercapture', () => touch.delete(side))
  button.addEventListener('pointercancel', () => touch.delete(side))
  button.addEventListener('pointerup', () => touch.delete(side))
}
find('drop').addEventListener('pointerdown', (e) => {
  e.preventDefault()
  drop()
})
find('drop').addEventListener('click', (e) => {
  if (!e.detail) drop()
})
window.addEventListener('resize', () => {
  world?.resize()
  world?.render()
})
if (coarse.matches) {
  document.querySelector<HTMLElement>('.controls .space')!.textContent = 'TAP'
  tip.textContent = 'Match the rings, then tap Drop'
  document.querySelector('#guide-content li')!.textContent =
    'Steer with the left and right buttons, or use A/D and the arrow keys.'
  document.querySelectorAll('#guide-content li')[1].textContent =
    'Tap Drop or press SPACE when the chimney ring turns mint and says DROP!'
}

function frame(now: number) {
  const real = Math.max(0, (now - lastFrame) / 1000)
  lastFrame = now
  if (world && !document.hidden && !dialog.open) {
    if (real > 0 && real < 0.75) {
      frameCount++
      sampleTime += real
      if (sampleTime >= 1) {
        const fps = frameCount / sampleTime
        world.samplePerformance(fps, sampleTime)
        find('fps').textContent = Math.round(fps) + ' FPS · ' + world.renderRatio.toFixed(2) + '×'
        frameCount = sampleTime = 0
      }
    }
    const inFlight = mode === 'playing' || mode === 'finishing'
    if (mode === 'intro') {
      introElapsed += real
      world.cinematic(introElapsed / 4.4)
      world.animate(Math.min(real, 0.1), 0, 0)
      if (introElapsed >= 4.4) launch()
    } else if (inFlight) {
      elapsed = Math.min(60, elapsed + real)
      updateTime()
      const right = pressed.has('KeyD') || pressed.has('ArrowRight') || touch.has(1)
      const left = pressed.has('KeyA') || pressed.has('ArrowLeft') || touch.has(-1)
      const steer = Number(right) - Number(left)
      // Small physics steps keep input and gift trajectories stable through slow frames.
      const simulated = Math.min(real, 0.4)
      const steps = Math.max(1, Math.ceil(simulated / 0.04))
      for (let i = 0; i < steps; i++) world.animate(simulated / steps, elapsed, steer)
      if (mode === 'playing' && elapsed >= 60) setMode('finishing')
      hint.hidden = mode !== 'playing' || !world.onTarget
      if (!hint.hidden) {
        const { x, y } = world.aimPosition()
        hint.style.left = x + 'px'
        hint.style.top = y - 17 + 'px'
      }
      tip.hidden = mode !== 'playing' || elapsed >= tipUntil
      if (mode === 'finishing' && !world.hasFalling) finishRound()
    } else if (!reducedMotion.matches) world.animate(Math.min(real, 0.1), 0, 0)
    world.render()
  }
  requestAnimationFrame(frame)
}

try {
  world = new World(sceneCanvas, find<HTMLCanvasElement>('sky'), {
    lock: () => {
      if (mode === 'playing') sound.lock()
    },
    delivered: (hit, point) => {
      if (!world) return
      const label = document.createElement('span')
      if (hit) {
        deliveries++
        streak++
        longest = Math.max(longest, streak)
        const gain = 100 * Math.min(5, streak)
        score += gain
        tipUntil = 0
        label.textContent = '+' + gain
        sound.hit(streak)
        announcer.textContent = `Gift delivered. ${score} points, streak of ${streak}.`
      } else {
        streak = 0
        label.textContent = 'MISSED'
        sound.miss()
      }
      updateScore()
      const p = world.screen(point)
      label.className = 'float-score' + (hit ? '' : ' missed')
      label.style.left = p.x + 'px'
      label.style.top = p.y - 18 + 'px'
      find('feedback').append(label)
      label.addEventListener('animationend', () => label.remove(), { once: true })
    },
  })
  world.setQuality(quality)
  world.render()
  lastFrame = performance.now()
  requestAnimationFrame(frame)
} catch (error) {
  console.error(error)
  paintSky(find<HTMLCanvasElement>('sky'), false)
  playButton.disabled = true
  const message = find('render-error')
  message.textContent =
    'The village needs WebGL 2. Turn on hardware acceleration in your browser, then reload to play.'
  message.hidden = false
}
