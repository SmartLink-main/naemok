import { AnnouncementCard } from '@/components/announcement/AnnouncementCard'
import { Announcement } from '@/types/announcement'

interface Top10ListProps {
  announcements: Announcement[]
}

export function Top10List({ announcements }: Top10ListProps) {
  if (announcements.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <p>현재 진행 중인 공고를 불러오고 있어요.</p>
        <p className="text-sm mt-1">잠시 후 다시 확인해주세요.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {announcements.map((a, idx) => (
        <div key={a.id} className="relative">
          <span className="absolute -top-2 -left-2 z-10 w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
            {idx + 1}
          </span>
          <AnnouncementCard announcement={a} />
        </div>
      ))}
    </div>
  )
}
