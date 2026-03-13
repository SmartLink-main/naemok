import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
import { DdayBadge } from '@/components/announcement/DdayBadge'
import { KakaoShareButton } from '@/components/announcement/KakaoShareButton'
import { PreRegisterForm } from '@/components/pre-register/PreRegisterForm'
import { Badge } from '@/components/ui/badge'
import { Announcement } from '@/types/announcement'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getAnnouncement(id: string): Promise<Announcement | null> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('announcements')
    .select('*')
    .eq('id', id)
    .single()
  return data as Announcement | null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const a = await getAnnouncement(id)
  if (!a) return { title: '공고를 찾을 수 없습니다 | 내몫' }

  const amount = a.amount_max ? `최대 ${a.amount_max.toLocaleString()}만원` : ''
  return {
    title: `${a.title} | 내몫`,
    description: `${amount} ${a.organization ?? ''} - ${a.summary ?? ''}`.trim(),
    openGraph: {
      title: a.title,
      description: `${amount} | ${a.end_date ? `마감 ${a.end_date}` : '상시'}`,
    },
  }
}

export default async function AnnouncementDetailPage({ params }: PageProps) {
  const { id } = await params
  const a = await getAnnouncement(id)
  if (!a) notFound()

  const currentUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://naemok.kr'}/announcements/${id}`

  const dateRange = [a.start_date, a.end_date]
    .filter(Boolean)
    .map((d) => d!.replace(/-/g, '.'))
    .join(' ~ ')

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link href="/" className="font-bold text-lg text-blue-600">내몫</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm truncate">{a.title}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* 공고 헤더 */}
        <div className="bg-white rounded-2xl border p-5 space-y-3">
          <div className="flex items-start gap-2">
            <h1 className="font-bold text-lg leading-tight flex-1">{a.title}</h1>
            <DdayBadge endDate={a.end_date} status={a.status} />
          </div>

          {a.organization && (
            <p className="text-sm text-muted-foreground">{a.organization}</p>
          )}

          {/* 지원금액 */}
          {(a.amount_max || a.amount_text) && (
            <div className="bg-blue-50 rounded-lg px-3 py-2">
              <p className="text-xs text-blue-500 font-medium">지원 금액</p>
              <p className="font-bold text-blue-700 text-lg">
                {a.amount_text ??
                  (a.amount_max && a.amount_min
                    ? `${a.amount_min.toLocaleString()}만원 ~ ${a.amount_max.toLocaleString()}만원`
                    : `최대 ${a.amount_max!.toLocaleString()}만원`)}
              </p>
            </div>
          )}

          {/* 신청 기간 */}
          {dateRange && (
            <div>
              <p className="text-xs text-muted-foreground font-medium">신청 기간</p>
              <p className="text-sm font-medium">{dateRange}</p>
            </div>
          )}

          {/* 태그 */}
          <div className="flex flex-wrap gap-1 pt-1">
            {a.region_tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
            ))}
            {a.industry_tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
            {a.stage_tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
            ))}
          </div>
        </div>

        {/* 자격조건 요약 */}
        {a.summary && (
          <div className="bg-white rounded-2xl border p-5">
            <h2 className="font-bold text-sm mb-2">자격 조건 요약</h2>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
              {a.summary}
            </p>
          </div>
        )}

        {/* 원문 링크 */}
        {a.original_url && (
          <a
            href={a.original_url}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-white rounded-2xl border p-4 text-center text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors"
          >
            기업마당에서 원문 공고 보기 →
          </a>
        )}

        {/* 카카오 공유 */}
        <KakaoShareButton announcement={a} currentUrl={currentUrl} />

        {/* 사전등록 */}
        <PreRegisterForm
          industryTags={a.industry_tags}
          regionTags={a.region_tags}
          stageTags={a.stage_tags}
        />
      </div>
    </main>
  )
}
