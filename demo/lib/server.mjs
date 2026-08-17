/**
 * Serves the production build for the demo recording.
 *
 * The dev server is the wrong thing to film: it injects the HMR client and
 * paints an error overlay over the app at the first warning, both of which
 * would end up in the gif. This serves build/ instead, with the SPA fallback
 * the router needs for /request and /listing.
 */

import { createServer } from 'node:http'
import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { extname, join, normalize } from 'node:path'

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
}

const fileAt = async (root, path) => {
  // normalize first: a request for /../../etc/passwd is not ours to serve
  const target = join(root, normalize(path).replace(/^(\.\.[/\\])+/, ''))
  try {
    const info = await stat(target)
    return info.isFile() ? target : null
  } catch {
    return null
  }
}

/**
 * @param {string} root  the build directory
 * @returns {Promise<{url: string, close: () => Promise<void>}>}
 */
export const serve = (root) => new Promise((resolve) => {
  const server = createServer(async (request, response) => {
    const { pathname } = new URL(request.url, 'http://localhost')
    const file = await fileAt(root, pathname) ?? await fileAt(root, 'index.html')
    if (!file) {
      response.writeHead(404).end('not found')
      return
    }
    response.writeHead(200, {
      'content-type': TYPES[extname(file)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    })
    createReadStream(file).pipe(response)
  })

  server.listen(0, '127.0.0.1', () => {
    const { port } = server.address()
    resolve({
      url: `http://127.0.0.1:${port}`,
      close: () => new Promise((done) => { server.close(done) }),
    })
  })
})
