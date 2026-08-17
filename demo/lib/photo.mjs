/**
 * Stand-in listing photos for the demo.
 *
 * The fixtures are invented, so there are no real photos to go with them and
 * no stock images to license. Rather than ship broken <img> tags or a folder
 * of borrowed jpegs, every card gets a flat illustration drawn from the app's
 * own tokens: warm enough to read as a photo slot at card size, obviously not
 * a photograph if you look. Deterministic in the seed, so re-recording the
 * demo produces the same frames.
 */

/* the terracotta / sage / stone set from src/index.scss */
const SKIES = [
  ['#f8e2d5', '#eec3a9'],
  ['#f3f5ec', '#e3e9d4'],
  ['#fbf0d9', '#f8e2d5'],
  ['#fdf4ef', '#f2ebe2'],
]

const WALLS = ['#c25f36', '#ad4e28', '#8c3d1f', '#7d8c4e', '#63713a', '#a3701a']
const ROOFS = ['#4b1f10', '#372b21', '#4c5729']

/* xorshift: same seed, same picture, no dependency */
const random = (seed) => {
  let state = (seed * 2654435761) % 2147483647
  if (state <= 0) state += 2147483646
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

const WIDTH = 640
const HEIGHT = 420

/**
 * @param {number} seed  the listing's number, so photo 07 is always photo 07
 * @returns {string} an SVG document
 */
export const photo = (seed) => {
  const next = random(seed + 1)
  const pick = (list) => list[Math.floor(next() * list.length)]
  const between = (min, max) => min + next() * (max - min)

  const [skyTop, skyBottom] = pick(SKIES)
  const horizon = HEIGHT * between(0.58, 0.68)

  // three to five volumes along the horizon, tallest roughly in the middle, so
  // the silhouette reads as a cluster of buildings rather than a bar chart
  const count = Math.round(between(3, 5))
  const houses = Array.from({ length: count }, (_, index) => {
    const width = WIDTH / count
    const middle = 1 - Math.abs((index + 0.5) / count - 0.5) * 2
    const height = between(70, 110) + middle * between(40, 90)
    return {
      x: index * width + between(4, 18),
      width: width - between(14, 34),
      height,
      wall: pick(WALLS),
      roof: pick(ROOFS),
      windows: Math.round(between(2, 4)),
    }
  })

  const windowsOf = (house) => Array.from({ length: house.windows }, (_, row) => {
    const size = Math.min(house.width / 5, 20)
    const gap = (house.width - size * 2) / 3
    return [0, 1].map((column) => {
      const y = horizon - house.height + 34 + row * (size + 14)
      if (y + size > horizon - 10) return ''
      const x = house.x + gap + column * (size + gap)
      return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${size.toFixed(1)}" height="${size.toFixed(1)}" rx="2" fill="#fdf4ef" opacity="${(0.55 + next() * 0.4).toFixed(2)}"/>`
    }).join('')
  }).join('')

  const bodies = houses.map((house) => {
    const top = horizon - house.height
    const eave = 14
    return [
      `<polygon points="${(house.x - eave).toFixed(1)},${top.toFixed(1)} ${(house.x + house.width + eave).toFixed(1)},${top.toFixed(1)} ${(house.x + house.width / 2).toFixed(1)},${(top - between(28, 46)).toFixed(1)}" fill="${house.roof}"/>`,
      `<rect x="${house.x.toFixed(1)}" y="${top.toFixed(1)}" width="${house.width.toFixed(1)}" height="${house.height.toFixed(1)}" fill="${house.wall}"/>`,
      windowsOf(house),
    ].join('')
  }).join('')

  return [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH}" height="${HEIGHT}" viewBox="0 0 ${WIDTH} ${HEIGHT}">`,
    `<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${skyTop}"/><stop offset="1" stop-color="${skyBottom}"/></linearGradient></defs>`,
    `<rect width="${WIDTH}" height="${HEIGHT}" fill="url(#sky)"/>`,
    `<circle cx="${(WIDTH * between(0.12, 0.86)).toFixed(1)}" cy="${(horizon * between(0.22, 0.42)).toFixed(1)}" r="${between(26, 44).toFixed(1)}" fill="#fdf4ef" opacity="0.75"/>`,
    bodies,
    `<rect y="${horizon.toFixed(1)}" width="${WIDTH}" height="${(HEIGHT - horizon).toFixed(1)}" fill="#63713a"/>`,
    `<rect y="${horizon.toFixed(1)}" width="${WIDTH}" height="${(HEIGHT - horizon).toFixed(1)}" fill="#241b14" opacity="0.12"/>`,
    '</svg>',
  ].join('')
}
