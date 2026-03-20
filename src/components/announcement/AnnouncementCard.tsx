import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { DdayBadge } from './DdayBadge'
import { Announcement } from '@/types/announcement'
import { MapPin, Building2 } from 'lucide-react'

interface AnnouncementCardProps {
  announcement: Announcement
}

export function AnnouncementCard({ announcement: a }: AnnouncementCardProps) {
  const amountLabel = formatAmount(a.amount_min, a.amount_max, a.amount_text)

  return (
    <Link href={`/announcements/${a.id}`} className="block group">
      <div className="bg-white rounded-2xl border hover:border-blue-300 hover:shadow-md transition-all h-full p-4 flex flex-col gap-2">
        {/* 상단: 제목 + D-day */}
        <div className="flex items-start gap-2">
          <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1 group-hover:text-blue-600 transition-colors">
            {a.title}
          </h3>
          <DdayBadge endDate={a.end_date} status={a.status} />
        </div>

        {/* 기관 */}
        {a.organization && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Building2 className="w-3 h-3 shrink-0" />
            <span className="truncate">{a.organization}</span>
          </div>
        )}

        {/* 금액 */}
        {amountLabel && (
          <div className="bg-blue-50 rounded-lg px-2.5 py-1.5 inline-flex w-fit">
            <span className="text-xs font-bold text-blue-700">{amountLabel}</span>
          </div>
        )}

        {/* 요약 */}
        {a.summary && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{a.summary}</p>
        )}

        {/* 태그 */}
        <div className="flex flex-wrap gap-1 pt-0.5">
          {a.region_tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs py-0 gap-0.5">
              <MapPin className="w-2.5 h-2.5" />{tag}
            </Badge>
          ))}
          {a.industry_tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs py-0">{tag}</Badge>
          ))}
          {a.stage_tags.slice(0, 1).map((tag) => (
            <Badge key={tag} className="text-xs py-0 bg-green-50 text-green-700 border-green-200 hover:bg-green-50">{tag}</Badge>
          ))}
        </div>
      </div>
    </Link>
  )
}

function formatAmount(min: number | null, max: number | null, text: string | null): string {
  if (text) return text
  if (max && min) return `${min.toLocaleString()}만원 ~ ${max.toLocaleString()}만원`
  if (max) return `최대 ${max.toLocaleString()}만원`
  if (min) return `${min.toLocaleString()}만원~`
  return ''
}
