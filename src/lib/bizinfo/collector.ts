/**
 * 기업마당 API → DB 저장 파이프라인 (FT-001)
 */

import { createAdminClient } from '@/lib/supabase/server'
import { fetchAllAnnouncements, BizinfoListItem } from './api'
import { extractIndustryTags, extractRegionTags, extractStageTags, parseAmount } from './tagger'

export interface CollectResult {
  total: number
  upserted: number
  closed: number
  errors: number
}

export async function collectAnnouncements(maxPages = 5): Promise<CollectResult> {
  const supabase = createAdminClient()
  const result: CollectResult = { total: 0, upserted: 0, closed: 0, errors: 0 }

  const items = await fetchAllAnnouncements(maxPages)
  result.total = items.length

  const rows = items.map(transformItem)

  const BATCH_SIZE = 100
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await supabase
      .from('announcements')
      .upsert(batch, { onConflict: 'bizinfo_id', ignoreDuplicates: false })

    if (error) {
      console.error('Upsert 오류:', error)
      result.errors += batch.length
    } else {
      result.upserted += batch.length
    }
  }

  // 마감일 지난 공고 자동 closed 전환
  const today = new Date().toISOString().split('T')[0]
  const { data: closedRows } = await supabase
    .from('announcements')
    .update({ status: 'closed' })
    .eq('status', 'active')
    .lt('end_date', today)
    .select('id')

  result.closed = closedRows?.length ?? 0

  await updateTop10Scores(supabase)

  return result
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim()
}

// YYYY-MM-DD 형식인지 검증
function isValidDate(s: string | null): string | null {
  if (!s) return null
  return /^\d{4}-\d{2}-\d{2}$/.test(s.trim()) ? s.trim() : null
}

function transformItem(item: BizinfoListItem) {
  // 날짜 파싱: "YYYY-MM-DD ~ YYYY-MM-DD" (예산 소진시까지 등 비정형 값 null 처리)
  const parts = item.reqstBeginEndDe ? item.reqstBeginEndDe.split('~') : []
  const startDate = isValidDate(parts[0] ?? null)
  const endDate = isValidDate(parts[1] ?? null)

  const cleanSummary = item.bsnsSumryCn ? stripHtml(item.bsnsSumryCn).slice(0, 300) : null

  // 태그 분류: 공고명 + 사업요약 + 지원대상 + 분야코드 조합
  const fullText = [
    item.pblancNm,
    item.trgetNm,
    item.pldirSportRealmLclasCodeNm,
    item.pldirSportRealmMlsfcCodeNm,
    item.hashtags,
    cleanSummary,
  ].filter(Boolean).join(' ')

  const { min, max } = parseAmount(cleanSummary ?? '')

  return {
    bizinfo_id: item.pblancId,
    title: item.pblancNm,
    organization: item.jrsdInsttNm || item.excInsttNm || null,
    amount_min: min,
    amount_max: max,
    amount_text: extractAmountText(cleanSummary),
    start_date: startDate,
    end_date: endDate,
    status: isExpired(endDate) ? 'closed' : 'active',
    industry_tags: extractIndustryTags(fullText),
    region_tags: extractRegionTags(fullText),
    stage_tags: extractStageTags(fullText),
    summary: cleanSummary,
    original_url: item.pblancUrl
      ? item.pblancUrl.startsWith('http')
        ? item.pblancUrl
        : `https://www.bizinfo.go.kr${item.pblancUrl}`
      : null,
  }
}

function isExpired(endDate: string | null): boolean {
  if (!endDate) return false
  return endDate < new Date().toISOString().split('T')[0]
}

function extractAmountText(text: string | null): string | null {
  if (!text) return null
  const match = text.match(/[\d,]+만\s*원[^.。\n]{0,20}/)
  return match ? match[0].trim() : null
}

async function updateTop10Scores(supabase: ReturnType<typeof createAdminClient>) {
  const today = new Date()

  const { data: active } = await supabase
    .from('announcements')
    .select('id, amount_max, end_date, region_tags, industry_tags')
    .eq('status', 'active')

  if (!active?.length) return

  const scored = active.map((a) => {
    const daysLeft = a.end_date
      ? Math.max(0, Math.ceil((new Date(a.end_date).getTime() - today.getTime()) / 86400000))
      : 999

    const urgencyScore = daysLeft <= 7 ? 30 : daysLeft <= 30 ? 20 : 0
    const amountScore = a.amount_max ? Math.min(30, Math.log10(a.amount_max + 1) * 10) : 0
    const universalScore =
      (a.region_tags?.includes('전국') ? 20 : 0) +
      (a.industry_tags?.length === 0 ? 10 : 0)

    return { id: a.id, top10_score: urgencyScore + amountScore + universalScore }
  })

  scored.sort((a, b) => b.top10_score - a.top10_score)
  const top10Ids = new Set(scored.slice(0, 10).map((s) => s.id))

  for (const item of scored) {
    await supabase
      .from('announcements')
      .update({ top10_score: item.top10_score, is_top10: top10Ids.has(item.id) })
      .eq('id', item.id)
  }
}
