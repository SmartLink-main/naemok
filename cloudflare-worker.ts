// @ts-expect-error `.open-next/worker.js` is generated during the Cloudflare build step.
import { default as handler } from './.open-next/worker.js'

interface CloudflareEnv {
  APP_URL: string
  CRON_SECRET: string
}

interface ScheduledExecutionContext {
  waitUntil(promise: Promise<unknown>): void
}

async function runCollection(env: CloudflareEnv) {
  if (!env.APP_URL) {
    throw new Error('APP_URL 환경변수가 설정되지 않았습니다.')
  }

  if (!env.CRON_SECRET) {
    throw new Error('CRON_SECRET 환경변수가 설정되지 않았습니다.')
  }

  const url = new URL('/api/cron/collect', env.APP_URL)
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      authorization: `Bearer ${env.CRON_SECRET}`,
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`공고 수집 호출 실패: ${response.status} ${body}`)
  }
}

const worker = {
  fetch: handler.fetch,

  async scheduled(
    _controller: unknown,
    env: CloudflareEnv,
    ctx: ScheduledExecutionContext
  ) {
    ctx.waitUntil(runCollection(env))
  },
}

export default worker

// The re-export is required if OpenNext enables Durable Object based caches.
// @ts-expect-error `.open-next/worker.js` is generated during the Cloudflare build step.
export { DOQueueHandler, DOShardedTagCache } from './.open-next/worker.js'
