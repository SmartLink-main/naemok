/**
 * 기업마당 공식 API 모듈
 * API 응답 구조: { jsonArray: [...] }
 * - totCnt: 전체 공고 수 (각 항목 내부에 포함)
 * - 날짜 형식: "YYYY-MM-DD ~ YYYY-MM-DD"
 * - bsnsSumryCn: HTML 포함
 */

const BIZINFO_BASE_URL = 'https://www.bizinfo.go.kr/uss/rss/bizinfoApi.do'

export interface BizinfoListItem {
  pblancId: string                      // 공고 ID
  pblancNm: string                      // 공고명
  jrsdInsttNm: string                   // 주관기관명
  excInsttNm: string                    // 수행기관명
  bsnsSumryCn: string                   // 사업 개요 (HTML 포함)
  reqstBeginEndDe: string               // 신청기간 "YYYY-MM-DD ~ YYYY-MM-DD"
  pblancUrl: string                     // 원문 URL
  trgetNm: string                       // 지원 대상 (소상공인, 중소기업 등)
  pldirSportRealmLclasCodeNm: string    // 지원분야 대분류 (창업, 경영, 수출 등)
  pldirSportRealmMlsfcCodeNm: string    // 지원분야 중분류
  hashtags: string                      // 해시태그
  totCnt: string                        // 전체 공고 수 (문자열)
}

interface FetchListOptions {
  pageIndex?: number
  pageUnit?: number
  field?: string   // 분야 코드
}

export async function fetchBizinfoList(options: FetchListOptions = {}): Promise<{
  items: BizinfoListItem[]
  totalCount: number
}> {
  const apiKey = process.env.BIZINFO_API_KEY
  if (!apiKey) throw new Error('BIZINFO_API_KEY 환경변수가 설정되지 않았습니다.')

  const params = new URLSearchParams({
    crtfcKey: apiKey,
    dataType: 'json',
    pageIndex: String(options.pageIndex ?? 1),
    pageUnit: String(options.pageUnit ?? 100),
    ...(options.field && { field: options.field }),
  })

  const res = await fetch(`${BIZINFO_BASE_URL}?${params.toString()}`, {
    cache: 'no-store',
    headers: { 'User-Agent': 'naemok/1.0' },
  })

  if (!res.ok) throw new Error(`기업마당 API 오류: ${res.status}`)

  const data = await res.json()
  const items: BizinfoListItem[] = data.jsonArray ?? []
  const totalCount = Number(items[0]?.totCnt ?? 0)

  return { items, totalCount }
}

/**
 * 전체 공고 수집 (페이지네이션)
 * maxPages: 배포 환경에서의 실행 시간 제한을 고려한 상한
 */
export async function fetchAllAnnouncements(maxPages = 5): Promise<BizinfoListItem[]> {
  const results: BizinfoListItem[] = []
  let page = 1

  while (page <= maxPages) {
    const { items, totalCount } = await fetchBizinfoList({ pageIndex: page, pageUnit: 100 })
    results.push(...items)

    const totalPages = Math.ceil(totalCount / 100)
    if (page >= totalPages) break

    page++
    if (page <= maxPages) await new Promise((r) => setTimeout(r, 300))
  }

  return results
}
