/**
 * The backend, as far as the demo is concerned.
 *
 * Nothing here talks to Idealista or Caasa.it. Scraping a live site to film a
 * demo would make the recording slow, non-reproducible and dependent on two
 * third parties not changing their markup on the morning you need it, so the
 * whole /v1 surface is answered from demo/fixtures instead. Same idea as the
 * fake projects crew films against: the app is real, the world it talks to is
 * a fixture.
 */

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { photo } from './photo.mjs'

const FIXTURES = join(dirname(fileURLToPath(import.meta.url)), '..', 'fixtures')

const json = (route, body) => route.fulfill({
  status: 200,
  contentType: 'application/json; charset=utf-8',
  body: JSON.stringify(body),
})

/**
 * The listing the preview pane iframes. The real one proxies the source page;
 * here it is a plain page in the app's colours, enough to show that selecting
 * a card fills the right-hand pane without pretending to be someone's site.
 */
const listingPage = (home) => `<!doctype html>
<html lang="it"><head><meta charset="utf-8"><title>${home.title}</title>
<style>
  :root { color-scheme: light }
  body { margin: 0; font: 15px/1.6 Inter, system-ui, sans-serif; color: #372b21; background: #fff }
  .shot { height: 230px; background: linear-gradient(120deg, #f8e2d5, #eec3a9); display: grid; place-items: center; color: #8c3d1f; font-size: 13px; letter-spacing: .14em; text-transform: uppercase }
  .body { padding: 26px 32px 40px }
  h1 { margin: 0 0 6px; font-size: 24px; color: #241b14 }
  .where { margin: 0 0 18px; color: #7a6a5c }
  .price { font-size: 28px; font-weight: 700; color: #ad4e28 }
  .specs { display: flex; gap: 10px; margin: 16px 0 22px; flex-wrap: wrap }
  .spec { border: 1px solid #e8ded2; border-radius: 999px; padding: 5px 14px; font-size: 13px; color: #4f4034 }
  p.text { margin: 0; color: #4f4034; max-width: 62ch }
  .src { margin-top: 26px; font-size: 12px; color: #95867a }
</style></head>
<body>
  <div class="shot">anteprima annuncio</div>
  <div class="body">
    <h1>${home.title}</h1>
    <p class="where">${home.location}</p>
    <div class="price">${new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(home.price)}</div>
    <div class="specs">
      <span class="spec">${home.m2} m²</span>
      <span class="spec">${Math.round(home.price / home.m2).toLocaleString('it-IT')} €/m²</span>
      <span class="spec">${home.city}</span>
    </div>
    <p class="text">${home.comment.trim()}</p>
    <p class="src">${home.source} · annuncio di esempio, dati non reali</p>
  </div>
</body></html>`

/**
 * Wires every request the app makes to a fixture.
 *
 * @param {import('playwright').Page} page
 * @returns {Promise<{homes: object[]}>} the fixture set, for the script to assert against
 */
export const stub = async (page) => {
  const locations = JSON.parse(await readFile(join(FIXTURES, 'locations.json'), 'utf8'))
  const homes = JSON.parse(await readFile(join(FIXTURES, 'homes.json'), 'utf8'))

  // one comune per job, as the real backend does, so the progress bar has
  // something to count through
  let jobs = []

  await page.route('**/photos.hoomes.demo/**', (route) => {
    const seed = parseInt(route.request().url().match(/(\d+)\.svg$/)?.[1] ?? '0', 10)
    route.fulfill({ status: 200, contentType: 'image/svg+xml', body: photo(seed) })
  })

  await page.route('**/v1/locations', (route) => json(route, locations))

  await page.route('**/v1/request', (route) => {
    const { codes } = route.request().postDataJSON()
    jobs = codes.map((code, index) => ({ job_id: `job-${index}-${code}`, status: 'queued' }))
    return json(route, { jobs_id: jobs.map((job) => job.job_id), message: 'ok' })
  })

  // Each poll finishes one more comune; the last one hands over the listings.
  // The app polls every five seconds, which record.mjs shortens for filming.
  await page.route('**/v1/jobs/**', (route) => {
    const pending = jobs.findIndex((job) => job.status !== 'finished')
    if (pending === -1) return json(route, { jobs, result: homes, finished: true })
    jobs[pending].status = 'finished'
    return json(route, { jobs, result: [], finished: false })
  })

  await page.route('**/v1/proxy**', (route) => {
    const target = new URL(route.request().url()).searchParams.get('url')
    const home = homes.find((candidate) => candidate.url === target) ?? homes[0]
    route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: listingPage(home) })
  })

  return { homes }
}
