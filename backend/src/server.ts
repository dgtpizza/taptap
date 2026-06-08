import closeWithGrace from 'close-with-grace'
import { buildApp } from '@/app'

async function start(): Promise<void> {
  const app = await buildApp()

  closeWithGrace({ delay: app.config.SHUTDOWN_DELAY_MS }, async ({ err }) => {
    if (err) app.log.error(err)
    await app.close()
  })

  await app.ready()
  await app.listen({ port: app.config.PORT, host: '0.0.0.0' })
}

start().catch((err) => {
  console.error(err)
  process.exit(1)
})
