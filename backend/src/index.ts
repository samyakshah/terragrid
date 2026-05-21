import app from './app.js'

const PORT = Number(process.env.PORT) || 3001
const NODE_ENV = process.env.NODE_ENV || 'development'

app.listen(PORT, () => {
  console.log(`[terragrid-backend] listening on port ${PORT} (${NODE_ENV})`)
})
