import { NextRequest, NextResponse } from 'next/server'
import { collectAnnouncements } from '@/lib/bizinfo/collector'

// Cloudflare Cron이 호출하는 엔드포인트
// wrangler.jsonc 의 cron 스케줄로 실행 (UTC 23,3,9시 = KST 오전 8시, 낮 12시, 오후 6시)
export async function GET(req: NextRequest) {
  // Cron 보안 검증 (무단 호출 방지)
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    console.log('[Cron] 공고 수집 시작')
    const result = await collectAnnouncements(5) // 최대 5페이지 (500건)
    console.log('[Cron] 수집 완료:', result)

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('[Cron] 수집 오류:', error)
    return NextResponse.json(
      { success: false, error: String(error) },
      { status: 500 }
    )
  }
}
