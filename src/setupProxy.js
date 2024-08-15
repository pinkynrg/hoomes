const { createProxyMiddleware } = require('http-proxy-middleware')

module.exports = (app) => {
  app.use(
    '/v1',
    createProxyMiddleware({
      target: 'http://localhost:5001',
      changeOrigin: true,
    }),
  )
}
