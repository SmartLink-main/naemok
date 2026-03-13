import { Suspense } from 'react'
import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { SearchForm } from '@/components/search/SearchForm'
import { SortFilterBar } from '@/components/search/SortFilterBar'
import { AnnouncementCard } from '@/components/announcement/AnnouncementCard'
import { PreRegisterForm } from '@/components/pre-register/PreRegisterForm'
import { PaginationNav } from '@/components/ui/PaginationNav'
import { Announcement } from '@/types/announcement'
import { Separator } from '@/components/ui/separator'

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

function applySort(data: Announcement[], sort: SortType): Announcement[] {
  const arr = [...data]
  if (sort === 'latest') {
    return arr.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  }
  if (sort === 'amount') {
    return arr.sort((a, b) => (b.amount_max ?? b.amount_min ?? 0) - (a.amount_max ?? a.amount_min ?? 0))
  }
  // deadline: end_date 오름차순 (null 뒤로)
  return arr.sort((a, b) => {
    if (!a.end_date) return 1
    if (!b.end_date) return -1
    return new Date(a.end_date).getTime() - new Date(b.end_date).getTime()
  })
}

function applyDeadlineFilter(data: Announcement[], deadline: string): Announcement[] {
  if (deadline === 'all' || deadline === 'closed') return data
  const days = parseInt(deadline, 10)
  const now = new Date()
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + days)
  return data.filter((a) => a.end_date && new Date(a.end_date) >= now && new Date(a.end_date) <= cutoff)
}

async function getSearchResults(industry?: string, region?: string, stage?: string, showClosed = false) {
  const supabase = await createServerClient()
  const hasFilter = industry || region || stage

  if (!hasFilter) {
    let q = supabase.from('announcements').select('*')
    if (!showClosed) q = q.eq('status', 'active')
    const { data } = await q.limit(100)
    return { recommended: [] as Announcement[], all: (data ?? []) as Announcement[] }
  }

  // 추천 공고: 입력된 모든 조건에 매칭
  let recQuery = supabase.from('announcements').select('*')
  if (!showClosed) recQuery = recQuery.eq('status', 'active')
  if (industry) recQuery = recQuery.contains('industry_tags', [industry])
  if (region) recQuery = recQuery.or(`region_tags.cs.{"전국"},region_tags.cs.{"${region}"}`)
  if (stage) recQuery = recQuery.contains('stage_tags', [stage])

  const { data: recommended } = await recQuery.limit(50)

  // 전체 공고: 하나 이상 조건 매칭
  const conditions: string[] = []
  if (industry) conditions.push(`industry_tags.cs.{"${industry}"}`)
  if (region) {
    conditions.push(`region_tags.cs.{"전국"}`, `region_tags.cs.{"${region}"}`)
  }
  if (stage) conditions.push(`stage_tags.cs.{"${stage}"}`)
  conditions.push('industry_tags.eq.{}')

  let allQuery = supabase.from('announcements').select('*')
  if (!showClosed) allQuery = allQuery.eq('status', 'active')
  const { data: all } = await allQuery.or(conditions.join(',')).limit(100)

  const recIds = new Set((recommended ?? []).map((a: Announcement) => a.id))
  const filteredAll = (all ?? []).filter((a: Announcement) => !recIds.has(a.id))

  return {
    recommended: (recommended ?? []) as Announcement[],
    all: filteredAll as Announcement[],
  }
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { industry, region, stage, sort: sortParam, deadline: deadlineParam, page: pageParam, rpage: rpageParam } = await searchParams
  const sort = (sortParam ?? 'deadline') as SortType
  const deadline = deadlineParam ?? 'all'

  const { recommended, all } = await getSearchResults(industry, region, stage, deadline === 'closed')
  const hasFilter = industry || region || stage

  const sortedRec = applyDeadlineFilter(applySort(recommended, sort), deadline)
  const sortedAll = applyDeadlineFilter(applySort(all, sort), deadline)
  const totalCount = sortedRec.length + sortedAll.length

  const page = Math.max(1, parseInt(pageParam ?? '1', 10))
  const rpage = Math.max(1, parseInt(rpageParam ?? '1', 10))
  const allTotalPages = Math.ceil(sortedAll.length / PAGE_SIZE)
  const recTotalPages = Math.ceil(sortedRec.length / PAGE_SIZE)
  const pagedAll = sortedAll.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const pagedRec = sortedRec.slice((rpage - 1) * PAGE_SIZE, rpage * PAGE_SIZE)
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

        {hasFilter && (
          <p className="text-sm text-muted-foreground">
            총 <span className="font-semibold text-foreground">{totalCount}건</span>의 지원금을 찾았어요
          </p>
        )}

        {/* 추천 공고 */}
        {sortedRec.length > 0 && (
          <section>
            <h2 className="font-bold text-sm mb-2 text-blue-600">
              내 조건에 딱 맞는 공고 {sortedRec.length}건
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pagedRec.map((a) => (
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

        {sortedRec.length > 0 && sortedAll.length > 0 && <Separator />}

        {/* 전체 공고 */}
        {sortedAll.length > 0 && (
          <section>
            <h2 className="font-bold text-sm mb-2 text-muted-foreground">
              {hasFilter ? `관련 공고 ${sortedAll.length}건 더보기` : `전체 공고 ${sortedAll.length}건`}
            </h2>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {pagedAll.map((a) => (
                <AnnouncementCard key={a.id} announcement={a} />
              ))}
            </div>
            <PaginationNav
              currentPage={page}
              totalPages={allTotalPages}
              paramName="page"
              searchParams={rawParams}
            />
          </section>
        )}

        {totalCount === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p>조건에 맞는 공고가 없어요.</p>
            <p className="text-sm mt-1">조건을 변경하거나 전체 공고를 확인해보세요.</p>
          </div>
        )}

        {/* 사전등록 */}
        <PreRegisterForm
          industryTags={industry ? [industry] : []}
          regionTags={region ? [region] : []}
          stageTags={stage ? [stage] : []}
        />
      </div>
    </main>
  )
}
