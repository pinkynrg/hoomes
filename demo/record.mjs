/**
 * Records the demo shown in the README.
 *
 *   npm run demo            (build first if build/ is missing or stale)
 *
 * The tape below is the whole script: land on the request page, pick three
 * comuni, watch the jobs finish, search inside the descriptions, open a
 * listing in the preview pane. Every answer comes from demo/fixtures via
 * demo/lib/stubs.mjs, so the recording is the same every time and needs
 * neither the Python backend nor a live scrape.
 *
 * Outputs docs/media/hoomes-demo.{gif,mp4} and a poster frame.
 */

import { spawn } from 'node:child_process'
import { mkdir, rm, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { chromium } from 'playwright'
import { serve } from './lib/server.mjs'
import { stub } from './lib/stubs.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const BUILD = join(ROOT, 'build')
const MEDIA = join(ROOT, 'docs', 'media')
const WORK = join(ROOT, 'demo', '.recording')

const VIEWPORT = { width: 1360, height: 850 } // the listing goes two-pane above 1200
/**
 * The gif is the one everybody downloads just by opening the README, and its
 * weight is frames times area with no interframe compression to save it, so it
 * is kept to the width it is actually displayed at. The mp4 has none of that
 * problem and stays big enough to embed on a site at 2x.
 */
const GIF_WIDTH = 720
const MP4_WIDTH = 1100
const FPS = 10

const run = (command, args) => new Promise((resolve, reject) => {
  const child = spawn(command, args, { stdio: ['ignore', 'ignore', 'pipe'] })
  let stderr = ''
  child.stderr.on('data', (chunk) => { stderr += chunk })
  child.on('error', reject)
  child.on('close', (code) => (
    code === 0 ? resolve() : reject(new Error(`${command} exited ${code}\n${stderr.slice(-1200)}`))
  ))
})

/**
 * Playwright drives the page without moving a visible cursor, so a recording
 * of it is a series of things happening for no reason. This paints one and
 * walks it to whatever is about to be clicked.
 */
const CURSOR = `
  const dot = document.createElement('div')
  dot.style.cssText = [
    'position:fixed', 'z-index:2147483647', 'top:0', 'left:0',
    'width:18px', 'height:18px', 'margin:-9px 0 0 -9px', 'border-radius:50%',
    'background:rgba(173,78,40,.35)', 'border:2px solid #ad4e28',
    'pointer-events:none', 'transition:transform .04s linear',
  ].join(';')
  const place = (event) => {
    dot.style.transform = 'translate(' + event.clientX + 'px,' + event.clientY + 'px)'
  }
  addEventListener('mousemove', place, true)
  addEventListener('mousedown', () => { dot.style.background = 'rgba(173,78,40,.7)' }, true)
  addEventListener('mouseup', () => { dot.style.background = 'rgba(173,78,40,.35)' }, true)
  const attach = () => document.body && document.body.appendChild(dot)
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', attach) : attach()
`

/**
 * The app polls the job endpoint every five seconds, which is right for a real
 * scrape and far too slow to film. Rather than make the interval configurable
 * in app code for the sake of a gif, the demo speeds the clock for long timers
 * only: the debounces the UI depends on (500ms search, 1s pagination) are left
 * exactly as a user experiences them.
 */
const FAST_POLL = `
  const original = window.setInterval
  window.setInterval = (handler, delay, ...rest) => (
    original(handler, delay >= 2000 ? 700 : delay, ...rest)
  )
`

const main = async () => {
  if (!existsSync(BUILD)) {
    throw new Error('build/ is missing: run `npm run build` first')
  }

  await rm(WORK, { recursive: true, force: true })
  await mkdir(WORK, { recursive: true })
  await mkdir(MEDIA, { recursive: true })

  const site = await serve(BUILD)
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    locale: 'it-IT',
    recordVideo: { dir: WORK, size: VIEWPORT },
    reducedMotion: 'no-preference',
  })

  // Recording starts the moment the page exists, so everything between here
  // and the first paint is white frames. Timing it lets ffmpeg cut exactly
  // that much off the front instead of guessing at a fixed offset.
  const page = await context.newPage()
  const recordingStarted = Date.now()
  await page.addInitScript(CURSOR)
  await page.addInitScript(FAST_POLL)
  await stub(page)

  // walk the pointer there first, so the click reads as a click
  const pointTo = async (locator) => {
    const box = await locator.boundingBox()
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 18 })
  }
  const click = async (locator) => {
    await pointTo(locator)
    await page.waitForTimeout(180)
    await locator.click()
  }

  await page.goto(`${site.url}/request`)
  await page.waitForSelector('input[role="combobox"]:not([disabled])')
  const leadIn = Math.max(0, (Date.now() - recordingStarted) / 1000 - 0.3)
  await page.waitForTimeout(700)

  const picker = page.locator('input[role="combobox"]')
  await click(picker)
  // A tape is a sequence: each comune has to finish being typed and accepted
  // before the next one starts, which is exactly what these rules forbid.
  /* eslint-disable no-restricted-syntax, no-await-in-loop */
  for (const comune of ['reggio nell', 'scandiano', 'sassuolo']) {
    await picker.type(comune, { delay: 55 })
    await page.waitForTimeout(520)
    await picker.press('Enter')
    await page.waitForTimeout(320)
  }
  /* eslint-enable no-restricted-syntax, no-await-in-loop */

  await page.waitForTimeout(350)
  await click(page.getByRole('button', { name: /cerca case/i }))

  // the progress panel, then the listing the jobs produced
  await page.waitForSelector('text=Stiamo raccogliendo gli annunci')
  await page.waitForSelector('#list', { timeout: 20000 })
  await page.waitForTimeout(1100)

  const search = page.getByPlaceholder(/cerca nelle descrizioni/i)
  await click(search)
  await search.type('giardino camino', { delay: 60 })
  await page.waitForTimeout(1800) // 500ms debounce, then read the affinità badges

  await click(page.getByRole('button', { name: /anteprima/i }).first())
  await page.waitForTimeout(2200)

  await context.close()
  await browser.close()
  await site.close()

  const [recorded] = (await readdir(WORK)).filter((name) => name.endsWith('.webm'))
  const source = join(WORK, recorded)
  const trimmed = join(WORK, 'trimmed.mp4')
  const scaleTo = (width) => `scale=${width}:-2:flags=lanczos`

  // cut the white lead-in once, at full size, so both outputs come off the
  // same clip and cannot drift apart
  await run('ffmpeg', ['-y', '-v', 'error', '-ss', leadIn.toFixed(2), '-i', source,
    '-vf', 'format=yuv420p', '-c:v', 'libx264', '-crf', '18', '-an', trimmed])

  // one shared palette for the whole clip: a per-frame palette makes the flat
  // terracotta panels shimmer between frames
  await run('ffmpeg', ['-y', '-v', 'error', '-i', trimmed,
    '-vf', `fps=${FPS},${scaleTo(GIF_WIDTH)},palettegen=stats_mode=diff`, join(WORK, 'palette.png')])
  await run('ffmpeg', ['-y', '-v', 'error', '-i', trimmed, '-i', join(WORK, 'palette.png'),
    '-lavfi', `fps=${FPS},${scaleTo(GIF_WIDTH)}[x];[x][1:v]paletteuse=dither=bayer:bayer_scale=3`,
    join(WORK, 'raw.gif')])
  await run('gifsicle', ['-O3', '--lossy=120', '--colors', '160', '--no-warnings',
    join(WORK, 'raw.gif'), '-o', join(MEDIA, 'hoomes-demo.gif')])

  await run('ffmpeg', ['-y', '-v', 'error', '-i', trimmed,
    '-vf', scaleTo(MP4_WIDTH), '-c:v', 'libx264', '-crf', '26',
    '-movflags', '+faststart', '-an', join(MEDIA, 'hoomes-demo.mp4')])

  // poster: the listing with results, not the request page it opens on
  await run('ffmpeg', ['-y', '-v', 'error', '-ss', '11', '-i', trimmed,
    '-frames:v', '1', '-vf', scaleTo(MP4_WIDTH), join(MEDIA, 'hoomes-demo-poster.png')])

  await rm(WORK, { recursive: true, force: true })
}

main().catch((error) => {
  console.error(error.message) // eslint-disable-line no-console -- it is a CLI
  process.exit(1)
})
