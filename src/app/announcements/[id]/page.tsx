import { notFound } from 'next/navigation'
import Link from 'next/link'
import type { Metadata } from 'next'
import { createServerClient } from '@/lib/supabase/server'
import { DdayBadge } from '@/components/announcement/DdayBadge'
import { KakaoShareButton } from '@/components/announcement/KakaoShareButton'
import { PreRegisterForm } from '@/components/pre-register/PreRegisterForm'
import { Badge } from '@/components/ui/badge'
import { Announcement } from '@/types/announcement'
import { Building2, CalendarRange, MapPin, Tag, ExternalLink } from 'lucide-react'

export const dynamic = 'force-dynamic'

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

  const amountLabel = a.amount_text
    ?? (a.amount_max && a.amount_min
      ? `${a.amount_min.toLocaleString()}만원 ~ ${a.amount_max.toLocaleString()}만원`
      : a.amount_max ? `최대 ${a.amount_max.toLocaleString()}만원` : null)

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-2">
          <Link href="/" className="font-bold text-lg text-blue-600">내몫</Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-sm truncate">{a.title}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-3">
        {/* 공고 헤더 */}
        <div className="bg-white rounded-2xl border p-5 space-y-4">
          <div className="flex items-start gap-2">
            <h1 className="font-bold text-lg leading-snug flex-1">{a.title}</h1>
            <DdayBadge endDate={a.end_date} status={a.status} />
          </div>

          {a.organization && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Building2 className="w-4 h-4 shrink-0" />
              <span>{a.organization}</span>
            </div>
          )}

          {/* 지원금액 */}
          {amountLabel && (
            <div className="bg-blue-50 rounded-xl px-4 py-3">
              <p className="text-xs text-blue-500 font-medium mb-0.5">지원 금액</p>
              <p className="font-bold text-blue-700 text-xl">{amountLabel}</p>
            </div>
          )}

          {/* 신청 기간 */}
          {dateRange && (
            <div className="flex items-center gap-1.5 text-sm">
              <CalendarRange className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="font-medium">{dateRange}</span>
            </div>
          )}

          {/* 태그 */}
          <div className="space-y-2">
            {a.region_tags.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {a.region_tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                ))}
              </div>
            )}
            {(a.industry_tags.length > 0 || a.stage_tags.length > 0) && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                {a.industry_tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
                {a.stage_tags.map((tag) => (
                  <Badge key={tag} className="text-xs bg-green-50 text-green-700 border-green-200 hover:bg-green-50">{tag}</Badge>
                ))}
              </div>
            )}
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

        {/* 카카오 공유 */}
        <KakaoShareButton announcement={a} currentUrl={currentUrl} />

        {/* 채널 추가 */}
        <PreRegisterForm />
      </div>

      {/* 하단 고정 원문 버튼 */}
      {a.original_url && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t px-4 py-3 z-10">
          <div className="max-w-2xl mx-auto">
            <a
              href={a.original_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl py-3 text-sm transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              기업마당에서 원문 공고 보기
            </a>
          </div>
        </div>
      )}
    </main>
  )
}
