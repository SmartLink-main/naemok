/**
 * 공고 텍스트에서 업종/지역/사업단계 태그를 자동 분류
 * 키워드 매핑 방식. 매칭 실패 시 빈 배열 반환 (→ DB에서 전체 분류로 처리)
 */

import { INDUSTRY_KEYWORDS, REGION_KEYWORDS, STAGE_KEYWORDS } from '@/constants/filters'

function extractTags(text: string, keywordMap: Record<string, string[]>): string[] {
  const normalized = text.toLowerCase()
  const matched: string[] = []

  for (const [tag, keywords] of Object.entries(keywordMap)) {
    if (keywords.some((kw) => normalized.includes(kw.toLowerCase()))) {
      matched.push(tag)
    }
  }

  return matched
}

export function extractIndustryTags(text: string): string[] {
  return extractTags(text, INDUSTRY_KEYWORDS)
}

export function extractRegionTags(text: string): string[] {
  const tags = extractTags(text, REGION_KEYWORDS)
  // 전국/전체가 명시되거나 아무 지역도 없으면 전국으로 처리
  if (tags.length === 0 || tags.includes('전국')) return ['전국']
  return tags
}

export function extractStageTags(text: string): string[] {
  return extractTags(text, STAGE_KEYWORDS)
}

/**
 * 신청기간 문자열 파싱 → { startDate, endDate }
 * 입력 예: "2026.01.01 ~ 2026.03.31" 또는 "26.01.01~26.03.31"
 */
export function parseDateRange(reqstBeginEndDe: string): {
  startDate: string | null
  endDate: string | null
} {
  if (!reqstBeginEndDe) return { startDate: null, endDate: null }

  const parts = reqstBeginEndDe.split('~').map((s) => s.trim())
  if (parts.length < 2) return { startDate: null, endDate: null }

  return {
    startDate: normalizeDate(parts[0]),
    endDate: normalizeDate(parts[1]),
  }
}

function normalizeDate(dateStr: string): string | null {
  // "2026.03.31" → "2026-03-31"
  const match = dateStr.match(/(\d{2,4})[.\-/](\d{2})[.\-/](\d{2})/)
  if (!match) return null

  let [, year, month, day] = match
  if (year.length === 2) year = `20${year}`

  return `${year}-${month}-${day}`
}

/**
 * 지원금액 텍스트 파싱 → { min, max }
 * 입력 예: "최대 500만원", "100만원~1,000만원", "협의"
 */
export function parseAmount(text: string): { min: number | null; max: number | null } {
  if (!text) return { min: null, max: null }

  // 숫자(만원) 추출
  const numbers = text.match(/[\d,]+(?=\s*만원)/g)
  if (!numbers || numbers.length === 0) return { min: null, max: null }

  const values = numbers.map((n) => parseInt(n.replace(/,/g, ''), 10))

  if (values.length === 1) {
    // "최대 500만원" → max만
    const isMax = /최대|이하|까지/.test(text)
    return { min: isMax ? null : values[0], max: isMax ? values[0] : values[0] }
  }

  return { min: Math.min(...values), max: Math.max(...values) }
}
