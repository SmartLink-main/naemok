import { Suspense } from 'react'
import { createServerClient } from '@/lib/supabase/server'
import { SearchForm } from '@/components/search/SearchForm'
import { Top10List } from '@/components/landing/Top10List'
import { Announcement } from '@/types/announcement'

export const dynamic = 'force-dynamic'

async function getTop10(): Promise<Announcement[]> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('status', 'active')
    .eq('is_top10', true)
    .order('top10_score', { ascending: false })
    .limit(10)

  return (data ?? []) as Announcement[]
}

export default async function HomePage() {
  const top10 = await getTop10()

  const currentMonth = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })

  return (
    <main className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <h1 className="font-bold text-lg text-blue-600">내몫</h1>
          <span className="ml-2 text-xs text-muted-foreground">정부 지원금 매칭</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* 검색 폼 */}
        <section>
          <Suspense>
            <SearchForm />
          </Suspense>
        </section>

        {/* TOP 10 */}
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-bold text-base">{currentMonth} 추천 지원금 TOP 10</h2>
            <span className="text-xs text-muted-foreground">검색 없이 바로 확인</span>
          </div>
          <Top10List announcements={top10} />
        </section>
      </div>
    </main>
  )
}
