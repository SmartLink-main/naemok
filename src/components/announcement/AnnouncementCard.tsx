import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DdayBadge } from './DdayBadge'
import { Announcement } from '@/types/announcement'

interface AnnouncementCardProps {
  announcement: Announcement
}

export function AnnouncementCard({ announcement: a }: AnnouncementCardProps) {
  const amountLabel = formatAmount(a.amount_min, a.amount_max, a.amount_text)

  return (
    <Link href={`/announcements/${a.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardHeader className="pb-2 space-y-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2 flex-1">
              {a.title}
            </h3>
            <DdayBadge endDate={a.end_date} status={a.status} />
          </div>
          {a.organization && (
            <p className="text-xs text-muted-foreground">{a.organization}</p>
          )}
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          {amountLabel && (
            <p className="text-sm font-medium text-blue-600">{amountLabel}</p>
          )}
          {a.summary && (
            <p className="text-xs text-muted-foreground line-clamp-2">{a.summary}</p>
          )}
          <div className="flex flex-wrap gap-1 pt-1">
            {a.region_tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
            {a.industry_tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs py-0">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
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
