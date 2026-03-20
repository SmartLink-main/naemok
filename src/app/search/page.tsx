import { Suspense } from 'react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { SearchForm } from '@/components/search/SearchForm'
import { SortFilterBar } from '@/components/search/SortFilterBar'
import { AnnouncementCard } from '@/components/announcement/AnnouncementCard'
import { PreRegisterForm } from '@/components/pre-register/PreRegisterForm'
import { PaginationNav } from '@/components/ui/PaginationNav'
import { RelatedSection } from '@/components/search/RelatedSection'
import { Announcement } from '@/types/announcement'

const PAGE_SIZE = 10

type SortType = 'deadline' | 'latest' | 'amount'

interface SearchPageProps {
  searchParams: Promise<{
    industry?: string
    region?: string
    stage?: string
    sort?: string
    deadline?: string
    page?: string
    rpage?: string
  }>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyQuery = any

// DB 정렬 적용
function applyDbSort(q: AnyQuery, sort: SortType): AnyQuery {
  if (sort === 'latest') return q.order('created_at', { ascending: false })
  if (sort === 'amount') return q.order('amount_max', { ascending: false, nullsFirst: false })
  return q.order('end_date', { ascending: true, nullsFirst: false })
}

// DB 마감 필터 적용
function applyDbDeadlineFilter(q: AnyQuery, deadline: string): AnyQuery {
  if (deadline === 'all' || deadline === 'closed') return q
  const days = parseInt(deadline, 10)
  const now = new Date().toISOString().split('T')[0]
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + days)
  const cutoffStr = cutoff.toISOString().split('T')[0]
  return q.gte('end_date', now).lte('end_date', cutoffStr)
}

interface SearchResult {
  recommended: Announcement[]
  recCount: number
  related: Announcement[]
  relCount: number
}

async function getSearchResults(
  industry: string | undefined,
  region: string | undefined,
  stage: string | undefined,
  sort: SortType,
  deadline: string,
  page: number,
  rpage: number,
  showClosed: boolean,
): Promise<SearchResult> {
  const supabase = await createServerClient()
  const hasFilter = industry || region || stage

  const base = () => {
    let q = supabase.from('announcements').select('*')
    if (!showClosed) q = q.eq('status', 'active')
    return applyDbDeadlineFilter(q, deadline)
  }

  if (!hasFilter) {
    // 필터 없음: 전체 서버사이드 페이지네이션
    const { count } = await base().select('*', { count: 'exact', head: true })
    const { data } = await applyDbSort(base(), sort)
      .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)
    return {
      recommended: [],
      recCount: 0,
      related: (data ?? []) as Announcement[],
      relCount: count ?? 0,
    }
  }

  // 추천: 모든 조건 매칭 (전체 fetch - 보통 소수)
  let recQ = base()
  if (industry) recQ = recQ.contains('industry_tags', [industry])
  if (region) recQ = recQ.or(`region_tags.cs.{"전국"},region_tags.cs.{"${region}"}`)
  if (stage) recQ = recQ.contains('stage_tags', [stage])
  recQ = applyDbSort(recQ, sort)

  const { data: recAll } = await recQ
  const recAllData = (recAll ?? []) as Announcement[]
  const recIds = recAllData.map((a) => a.id)

  // 추천 클라이언트 페이지네이션
  const recCount = recAllData.length
  const recommended = recAllData.slice((rpage - 1) * PAGE_SIZE, rpage * PAGE_SIZE)

  // 관련: OR 조건 + 추천 제외, 서버사이드 페이지네이션
  const orConditions: string[] = []
  if (industry) orConditions.push(`industry_tags.cs.{"${industry}"}`)
  if (region) orConditions.push(`region_tags.cs.{"전국"}`, `region_tags.cs.{"${region}"}`)
  if (stage) orConditions.push(`stage_tags.cs.{"${stage}"}`)
  orConditions.push('industry_tags.eq.{}')

  let relBase = base().or(orConditions.join(','))
  if (recIds.length > 0) relBase = relBase.not('id', 'in', `(${recIds.join(',')})`)

  const { count: relCount } = await relBase.select('*', { count: 'exact', head: true })

  let relQ = base().or(orConditions.join(','))
  if (recIds.length > 0) relQ = relQ.not('id', 'in', `(${recIds.join(',')})`)
  const { data: related } = await applyDbSort(relQ, sort)
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

  return {
    recommended,
    recCount,
    related: (related ?? []) as Announcement[],
    relCount: relCount ?? 0,
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const {
    industry, region, stage,
    sort: sortParam, deadline: deadlineParam,
    page: pageParam, rpage: rpageParam,
  } = await searchParams

  const sort = (sortParam ?? 'deadline') as SortType
  const deadline = deadlineParam ?? 'all'
  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const rpage = Math.max(1, parseInt(rpageParam ?? '1', 10))
  const hasFilter = industry || region || stage

  const { recommended, recCount, related, relCount } = await getSearchResults(
    industry, region, stage, sort, deadline, page, rpage, deadline === 'closed'
  )

  const recTotalPages = Math.ceil(recCount / PAGE_SIZE)
  const relTotalPages = Math.ceil(relCount / PAGE_SIZE)
  const rawParams = { industry, region, stage, sort: sortParam, deadline: deadlineParam, page: pageParam, rpage: rpageParam }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link href="/" className="font-bold text-lg text-blue-600">내몫</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm">검색 결과</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <Suspense>
          <SearchForm />
        </Suspense>

        <Suspense>
          <SortFilterBar />
        </Suspense>

        {/* 추천 공고 */}
        {recCount > 0 && (
          <section>
            <p className="text-sm text-muted-foreground mb-3">
              내 조건에 딱 맞는 공고{' '}
              <span className="font-semibold text-blue-600">{recCount}건</span>
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {recommended.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))}
            </div>
            <PaginationNav
              currentPage={rpage}
              totalPages={recTotalPages}
              paramName="rpage"
              searchParams={rawParams}
            />
          </section>
        )}

        {/* 추천 공고 없을 때 */}
        {recCount === 0 && hasFilter && (
          <div className="bg-white rounded-2xl border p-6 text-center space-y-4">
            <div className="text-4xl">🔍</div>
            <div>
              <p className="font-semibold text-base">조건에 딱 맞는 공고가 없어요</p>
              <p className="text-sm text-muted-foreground mt-1">
                {relCount > 0
                  ? '아래 관련 공고를 확인하거나, 알림을 설정해두세요.'
                  : '알림을 설정해두면 새 공고가 올라올 때 바로 알려드릴게요.'}
              </p>
            </div>
            <PreRegisterForm
              industryTags={industry ? [industry] : []}
              regionTags={region ? [region] : []}
              stageTags={stage ? [stage] : []}
            />
          </div>
        )}

        {/* 관련 공고 (접힌 상태) */}
        {relCount > 0 && hasFilter && (
          <Suspense>
            <RelatedSection
              announcements={related}
              currentPage={page}
              totalPages={relTotalPages}
              totalCount={relCount}
              rawParams={rawParams}
              hasRecommended={recCount > 0}
            />
          </Suspense>
        )}

        {/* 필터 없을 때 전체 공고 */}
        {!hasFilter && related.length > 0 && (
          <section>
            <p className="text-sm text-muted-foreground mb-3">
              전체 공고 <span className="font-semibold text-foreground">{relCount}건</span>
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {related.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))}
            </div>
            <PaginationNav
              currentPage={page}
              totalPages={relTotalPages}
              paramName="page"
              searchParams={rawParams}
            />
          </section>
        )}

        {/* 하단 알림 등록 */}
        {recCount > 0 && (
          <PreRegisterForm
            industryTags={industry ? [industry] : []}
            regionTags={region ? [region] : []}
            stageTags={stage ? [stage] : []}
          />
        )}
      </div>
    </main>
  )
}
