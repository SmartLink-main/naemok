'use client'

import { useState } from 'react'
import { AnnouncementCard } from '@/components/announcement/AnnouncementCard'
import { PaginationNav } from '@/components/ui/PaginationNav'
import { Announcement } from '@/types/announcement'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface RelatedSectionProps {
  announcements: Announcement[]
  currentPage: number
  totalPages: number
  totalCount: number
  rawParams: Record<string, string | undefined>
  hasRecommended: boolean
}

export function RelatedSection({
  announcements,
  currentPage,
  totalPages,
  totalCount,
  rawParams,
  hasRecommended,
}: RelatedSectionProps) {
  const [open, setOpen] = useState(!hasRecommended)

  return (
    <section>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3 w-full text-left"
      >
        <span>관련 공고 {totalCount}건 더보기</span>
        {open ? <ChevronUp className="w-4 h-4 ml-auto" /> : <ChevronDown className="w-4 h-4 ml-auto" />}
      </button>

      {open && (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
          <PaginationNav
            currentPage={currentPage}
            totalPages={totalPages}
            paramName="page"
            searchParams={rawParams}
          />
        </>
      )}
    </section>
  )
}
